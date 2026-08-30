import { deflateSync } from 'node:zlib'
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

function crc32(buf) {
  let c = 0xffffffff
  for (const b of buf) {
    c ^= b
    for (let i = 0; i < 8; i++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  }
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const typeBuf = Buffer.from(type)
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])))
  return Buffer.concat([len, typeBuf, data, crc])
}

function png(size) {
  const pixels = Buffer.alloc(size * (1 + size * 4))
  const flame = (x, y) => {
    const nx = (x + 0.5) / size - 0.5
    const ny = (y + 0.5) / size - 0.42
    const r = Math.sqrt(nx * nx * 1.6 + (ny + 0.08) * (ny + 0.08) * 0.7)
    return r < 0.22 && ny < 0.12
  }
  for (let y = 0; y < size; y++) {
    const row = y * (1 + size * 4)
    pixels[row] = 0
    for (let x = 0; x < size; x++) {
      const i = row + 1 + x * 4
      if (flame(x, y)) {
        pixels[i] = 0xc4
        pixels[i + 1] = 0x5c
        pixels[i + 2] = 0x26
      } else {
        pixels[i] = 0xf6
        pixels[i + 1] = 0xf6
        pixels[i + 2] = 0xf4
      }
      pixels[i + 3] = 255
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(pixels)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

writeFileSync(join(root, 'public/icons/icon-192.png'), png(192))
writeFileSync(join(root, 'public/icons/icon-512.png'), png(512))
writeFileSync(join(root, 'public/apple-touch-icon.png'), png(180))
console.log('wrote png icons')
