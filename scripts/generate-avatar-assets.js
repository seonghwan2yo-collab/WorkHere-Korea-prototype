import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const rootDir = process.cwd()
const rawDir = path.join(rootDir, 'public', 'mock', 'raw')
const processedDir = path.join(rootDir, 'public', 'mock', 'avatars', 'processed')
const manifestPath = path.join(rootDir, 'src', 'data', 'avatarManifest.json')
const usersPath = path.join(rootDir, 'src', 'data', 'sampleUsers.json')
const supportedExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.svg'])
const keepAvatarEmptyUserIds = new Set([2, 5, 8, 10, 11, 12])

async function listImageFiles(dir) {
  try {
    const files = await fs.readdir(dir, { withFileTypes: true })
    return files
      .filter((file) => file.isFile() && supportedExtensions.has(path.extname(file.name).toLowerCase()))
      .map((file) => path.join(dir, file.name))
      .sort((a, b) => path.basename(a).localeCompare(path.basename(b)))
  } catch (error) {
    if (error.code === 'ENOENT') return []
    throw error
  }
}

async function ensureFallbackSources() {
  const fallbackDir = path.join(rootDir, 'public', 'mock', 'avatars')
  const files = await listImageFiles(fallbackDir)
  return files.filter((file) => !file.includes(`${path.sep}processed${path.sep}`) && !file.includes(`${path.sep}raw${path.sep}`))
}

async function generateProcessedAvatars(sourceFiles) {
  await fs.mkdir(processedDir, { recursive: true })
  await fs.mkdir(path.dirname(manifestPath), { recursive: true })

  const manifest = []
  for (const [index, sourcePath] of sourceFiles.entries()) {
    const id = index + 1
    const fileName = `avatar-${String(id).padStart(3, '0')}.webp`
    const outputPath = path.join(processedDir, fileName)

    await sharp(sourcePath, { animated: false })
      .resize({
        width: 512,
        height: 512,
        fit: 'cover',
        position: 'north',
        withoutEnlargement: false,
      })
      .webp({ quality: 88, effort: 4 })
      .toFile(outputPath)

    manifest.push({
      id,
      fileName,
      avatarUrl: `/mock/avatars/processed/${fileName}`,
      sourceFileName: path.basename(sourcePath),
    })
  }

  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
  return manifest
}

async function updateSampleUsers(manifest) {
  const rawUsers = await fs.readFile(usersPath, 'utf8')
  const users = JSON.parse(rawUsers)

  const updated = users.map((user, index) => {
    const shouldKeepEmpty = keepAvatarEmptyUserIds.has(Number(user.id))
    if (shouldKeepEmpty || manifest.length === 0) {
      return { ...user, avatarUrl: null }
    }
    const avatar = manifest[(index * 3) % manifest.length]
    return { ...user, avatarUrl: avatar.avatarUrl }
  })

  await fs.writeFile(usersPath, `${JSON.stringify(updated, null, 2)}\n`, 'utf8')
  return updated
}

async function main() {
  await fs.mkdir(rawDir, { recursive: true })
  const rawFiles = await listImageFiles(rawDir)
  const sourceFiles = rawFiles.length > 0 ? rawFiles : await ensureFallbackSources()

  if (rawFiles.length === 0) {
    console.warn('No raw images found in public/mock/raw. Using existing mock avatar files as fallback sources for this run.')
  }

  if (sourceFiles.length === 0) {
    await fs.mkdir(processedDir, { recursive: true })
    await fs.writeFile(manifestPath, '[]\n', 'utf8')
    console.warn('No avatar source images found. Wrote an empty avatarManifest.json.')
    return
  }

  const manifest = await generateProcessedAvatars(sourceFiles)
  const users = await updateSampleUsers(manifest)
  const usersWithAvatar = users.filter((user) => user.avatarUrl).length

  console.log(`Generated ${manifest.length} processed avatar image(s).`)
  console.log(`Updated sampleUsers.json: ${usersWithAvatar}/${users.length} users have avatarUrl.`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
