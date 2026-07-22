type VercelRequest = {
  method?: string
  query: Record<string, string | string[] | undefined>
}

type VercelResponse = {
  status: (code: number) => VercelResponse
  setHeader: (name: string, value: string) => void
  json: (body: unknown) => void
  end: () => void
}

function firstQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300')

  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const restKey = process.env.KAKAO_REST_API_KEY || process.env.VITE_KAKAO_LOCAL_REST_KEY
  if (!restKey) {
    res.status(500).json({ error: 'Kakao REST API key is not configured.' })
    return
  }

  const query = firstQueryValue(req.query.query)?.trim() || '외국인지원센터'
  const region = firstQueryValue(req.query.region)?.trim() || ''
  const lat = firstQueryValue(req.query.lat)?.trim()
  const lng = firstQueryValue(req.query.lng)?.trim()
  const radius = firstQueryValue(req.query.radius)?.trim() || '15000'
  const hasCoordinates = Boolean(lat && lng)
  const searchQuery = hasCoordinates ? query : `${region} ${query}`.trim()
  const requestUrl = new URL('https://dapi.kakao.com/v2/local/search/keyword.json')
  requestUrl.searchParams.set('query', searchQuery)
  requestUrl.searchParams.set('size', '15')
  requestUrl.searchParams.set('sort', 'accuracy')
  if (hasCoordinates) {
    requestUrl.searchParams.set('x', lng as string)
    requestUrl.searchParams.set('y', lat as string)
    requestUrl.searchParams.set('radius', radius)
  }

  try {
    const response = await fetch(requestUrl, {
      headers: {
        Authorization: `KakaoAK ${restKey}`,
      },
    })
    const payload = await response.json()

    if (!response.ok) {
      res.status(response.status).json({
        error: 'Kakao Local request failed.',
        detail: payload,
      })
      return
    }

    res.status(200).json(payload)
  } catch {
    res.status(502).json({ error: 'Kakao Local proxy request failed.' })
  }
}
