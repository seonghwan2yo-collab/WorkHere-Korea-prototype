import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const kakaoRestKey = env.KAKAO_REST_API_KEY || env.VITE_KAKAO_LOCAL_REST_KEY

  return {
    base: './',
    plugins: [react()],
    server: kakaoRestKey
      ? {
          proxy: {
            '/api/kakao-local': {
              target: 'https://dapi.kakao.com',
              changeOrigin: true,
              secure: true,
              headers: {
                Authorization: `KakaoAK ${kakaoRestKey}`,
              },
              rewrite: (path) => {
                const incomingUrl = new URL(path, 'http://localhost')
                const query = incomingUrl.searchParams.get('query') || '외국인지원센터'
                const region = incomingUrl.searchParams.get('region') || ''
                const lat = incomingUrl.searchParams.get('lat') || ''
                const lng = incomingUrl.searchParams.get('lng') || ''
                const radius = incomingUrl.searchParams.get('radius') || '15000'
                const hasCoordinates = Boolean(lat && lng)
                const searchParams = new URLSearchParams()
                searchParams.set('query', hasCoordinates ? query : `${region} ${query}`.trim())
                searchParams.set('size', '15')
                searchParams.set('sort', 'accuracy')
                if (hasCoordinates) {
                  searchParams.set('x', lng)
                  searchParams.set('y', lat)
                  searchParams.set('radius', radius)
                }
                return `/v2/local/search/keyword.json?${searchParams.toString()}`
              },
            },
          },
        }
      : undefined,
  }
})
