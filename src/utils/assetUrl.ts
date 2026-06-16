const externalAssetPattern = /^(https?:|data:|blob:)/i

export function assetUrl(url?: string | null) {
  if (!url) return undefined
  if (externalAssetPattern.test(url)) return url
  if (!url.startsWith('/')) return url

  const baseUrl = import.meta.env.BASE_URL || '/'
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
  return `${normalizedBase}${url.slice(1)}`
}
