import type { Language, Place } from '../types'

type KakaoLocalDocument = {
  id?: string
  place_name?: string
  category_name?: string
  phone?: string
  address_name?: string
  road_address_name?: string
  x?: string
  y?: string
  distance?: string
  place_url?: string
}

type KakaoLocalResponse = {
  documents?: KakaoLocalDocument[]
}

export type LifeMapSearchMode = 'local-mock' | 'kakao-local' | 'kakao-local-error'

export type LifeMapSearchResult = {
  mode: LifeMapSearchMode
  places: Place[]
  message: string
  meta: {
    keyword: string
    region: string
    kakaoCount: number
    fallbackCount: number
    totalCount: number
    queriedTerms: string[]
  }
}

type LifeMapSearchParams = {
  keyword: string
  region: string
  categories: string[]
  language: 'all' | Language
  fallbackPlaces: Place[]
  location?: {
    lat: number
    lng: number
  } | null
}

type SearchPlan = {
  query: string
  category: string
}

type CategorySearchRule = {
  terms: string[]
  includes: string[]
  excludes?: string[]
}

const CATEGORY_SEARCH_RULES: Record<string, CategorySearchRule> = {
  병원: {
    terms: ['외국인 진료 병원', '국제진료센터', '보건소', '응급실 병원'],
    includes: ['병원', '의원', '의료', '진료', '보건소', '응급실', '국제진료'],
    excludes: ['동물병원'],
  },
  약국: {
    terms: ['공공심야약국', '약국', '외국어 약국'],
    includes: ['약국', '의약품', '심야약국'],
  },
  상담기관: {
    terms: ['외국인근로자지원센터', '외국인노동자지원센터', '노동상담', '다문화가족지원센터'],
    includes: ['외국인', '근로자', '노동', '상담', '다문화', '센터', '고용노동'],
  },
  '송금/은행': {
    terms: ['외국인 송금', '환전 은행', '외환 송금', '은행'],
    includes: ['은행', '환전', '외환', '송금', '금융'],
  },
  '통신/유심': {
    terms: ['외국인 선불유심', '알뜰폰', '휴대폰 매장', '통신사 대리점'],
    includes: ['통신', '휴대폰', '알뜰폰', '유심', '대리점', '모바일'],
  },
  '음식점/마트': {
    terms: ['외국 식품 마트', '아시아 식품마트', '할랄 식당', '마트'],
    includes: ['마트', '식품', '식당', '음식', '할랄', '아시아', '편의점'],
  },
  행정기관: {
    terms: ['출입국 외국인청', '외국인 민원센터', '행정복지센터', '주민센터'],
    includes: ['출입국', '외국인청', '민원', '행정', '주민센터', '행정복지센터', '구청', '시청'],
  },
  '안전/산재': {
    terms: ['근로복지공단', '산재 상담', '고용노동부 노동청', '산재병원'],
    includes: ['근로복지공단', '산재', '노동청', '고용노동', '상담', '병원'],
  },
  '종교/커뮤니티': {
    terms: ['외국인 커뮤니티센터', '외국인 교회', '이슬람 사원', '다문화센터'],
    includes: ['외국인', '커뮤니티', '교회', '성당', '사원', '이슬람', '다문화', '센터'],
  },
}

const DEFAULT_SEARCH_RULE: CategorySearchRule = {
  terms: ['외국인지원센터', '다문화가족지원센터', '외국인 생활지원'],
  includes: ['외국인', '다문화', '지원', '센터', '상담'],
}

function stableNegativeId(value: string) {
  const hash = Array.from(value).reduce((acc, char) => ((acc << 5) - acc + char.charCodeAt(0)) | 0, 0)
  return -Math.abs(hash || 1)
}

function categoryFromKakao(categoryName: string, fallbackCategory: string) {
  if (categoryName.includes('병원') || categoryName.includes('의료')) return '병원'
  if (categoryName.includes('약국')) return '약국'
  if (categoryName.includes('은행') || categoryName.includes('환전') || categoryName.includes('송금')) return '송금/은행'
  if (categoryName.includes('공공') || categoryName.includes('행정') || categoryName.includes('주민센터')) return '행정기관'
  if (categoryName.includes('음식') || categoryName.includes('마트') || categoryName.includes('편의점')) return '음식점/마트'
  if (categoryName.includes('통신') || categoryName.includes('휴대폰')) return '통신/유심'
  return fallbackCategory || '상담기관'
}

function documentText(document: KakaoLocalDocument) {
  return [
    document.place_name,
    document.category_name,
    document.address_name,
    document.road_address_name,
  ].filter(Boolean).join(' ')
}

function isRelevantDocument(document: KakaoLocalDocument, category: string, query: string) {
  const rule = CATEGORY_SEARCH_RULES[category] || DEFAULT_SEARCH_RULE
  const text = documentText(document)
  if (rule.excludes?.some((keyword) => text.includes(keyword))) return false
  if (rule.includes.some((keyword) => text.includes(keyword))) return true

  const compactQuery = query.replace(/\s/g, '')
  return compactQuery.length >= 3 && text.replace(/\s/g, '').includes(compactQuery)
}

function createSearchPlans(params: LifeMapSearchParams) {
  const keyword = params.keyword.trim()
  const selectedCategories = params.categories.length ? params.categories : Object.keys(CATEGORY_SEARCH_RULES)
  const plans: SearchPlan[] = []

  if (keyword) {
    selectedCategories.slice(0, 4).forEach((category) => {
      plans.push({ query: `${keyword} ${category}`.trim(), category })
    })
    plans.push({ query: keyword, category: selectedCategories[0] || '상담기관' })
  } else {
    selectedCategories.forEach((category) => {
      const rule = CATEGORY_SEARCH_RULES[category] || DEFAULT_SEARCH_RULE
      rule.terms.slice(0, 2).forEach((query) => plans.push({ query, category }))
    })
  }

  const seen = new Set<string>()
  return plans
    .filter((plan) => {
      const key = `${plan.category}-${plan.query}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .slice(0, 10)
}

function normalizeKakaoDocument(document: KakaoLocalDocument, index: number, fallbackCategory: string, region: string): Place {
  const category = categoryFromKakao(document.category_name || '', fallbackCategory)
  const lat = Number(document.y)
  const lng = Number(document.x)
  const distanceM = Number(document.distance)
  const placeName = document.place_name || `${category} 검색 결과 ${index + 1}`
  const address = document.road_address_name || document.address_name || `${region} 주소 확인 필요`
  const directionsUrl = Number.isFinite(lat) && Number.isFinite(lng)
    ? `https://map.kakao.com/link/to/${encodeURIComponent(placeName)},${lat},${lng}`
    : `https://map.kakao.com/?q=${encodeURIComponent(`${placeName} ${address}`)}`

  return {
    id: stableNegativeId(document.id || `${document.place_name}-${index}`),
    name: placeName,
    category,
    region,
    address,
    phone: document.phone || '전화 확인 필요',
    hours: '방문 전 운영시간 확인 필요',
    languages: ['ko'],
    distanceKm: Number.isFinite(distanceM) && distanceM > 0 ? Number((distanceM / 1000).toFixed(1)) : undefined,
    isOpen: undefined,
    services: ['카카오 Local 검색', category, '방문 전 확인'],
    foreignerFriendly: false,
    linkedFeedIds: [],
    linkedPostIds: [],
    reviews: ['카카오 Local API 검색 결과입니다. 방문 전 전화로 운영 여부를 확인하세요.'],
    lat: Number.isFinite(lat) ? lat : 36.713,
    lng: Number.isFinite(lng) ? lng : 127.429,
    externalUrl: document.place_url,
    directionsUrl,
    lastVerifiedAt: '카카오 Local 실시간 검색',
    source: 'operator',
    approvalStatus: 'approved',
    reviewHistory: document.place_url ? [`Kakao Local: ${document.place_url}`] : ['Kakao Local 검색 결과'],
  }
}

function filterFallbackPlaces({ keyword, language, fallbackPlaces }: LifeMapSearchParams) {
  const normalizedKeyword = keyword.trim()
  return fallbackPlaces
    .filter((place) => language === 'all' || place.languages.includes(language))
    .filter((place) => {
      if (!normalizedKeyword) return true
      return `${place.name} ${place.category} ${place.address} ${place.services?.join(' ')}`.includes(normalizedKeyword)
    })
}

function distanceKmBetween(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const earthRadiusKm = 6371
  const latDelta = ((b.lat - a.lat) * Math.PI) / 180
  const lngDelta = ((b.lng - a.lng) * Math.PI) / 180
  const startLat = (a.lat * Math.PI) / 180
  const endLat = (b.lat * Math.PI) / 180
  const haversine = Math.sin(latDelta / 2) ** 2
    + Math.cos(startLat) * Math.cos(endLat) * Math.sin(lngDelta / 2) ** 2
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
}

function sortByCurrentLocation(places: Place[], location?: LifeMapSearchParams['location']) {
  if (!location) return places

  return [...places]
    .map((place) => ({
      place: {
        ...place,
        distanceKm: Number.isFinite(place.lat) && Number.isFinite(place.lng)
          ? Number(distanceKmBetween(location, { lat: place.lat, lng: place.lng }).toFixed(1))
          : place.distanceKm,
      },
    }))
    .sort((a, b) => (a.place.distanceKm || 99) - (b.place.distanceKm || 99))
    .map(({ place }) => place)
}

function createSearchMeta(params: LifeMapSearchParams, kakaoCount: number, fallbackCount: number, totalCount: number, queriedTerms: string[]) {
  return {
    keyword: params.keyword.trim(),
    region: params.region,
    kakaoCount,
    fallbackCount,
    totalCount,
    queriedTerms,
  }
}

export async function searchLifeMapPlaces(params: LifeMapSearchParams): Promise<LifeMapSearchResult> {
  const proxyUrl = import.meta.env.VITE_KAKAO_LOCAL_PROXY_URL || '/api/kakao-local'
  const fallbackPlaces = sortByCurrentLocation(filterFallbackPlaces(params), params.location)
  const isAllRegionOverview = params.region === '전국' && !params.keyword.trim() && !params.location

  if (isAllRegionOverview || !proxyUrl) {
    return {
      mode: 'local-mock',
      places: fallbackPlaces,
      message: isAllRegionOverview
        ? '전체 지역의 운영자 추천 장소와 외국인 밀집지역을 지도에 표시 중입니다.'
        : '현재는 MVP 장소 데이터로 표시 중입니다. 서버 프록시 연결 후 카카오 Local 검색으로 전환됩니다.',
      meta: createSearchMeta(params, 0, fallbackPlaces.length, fallbackPlaces.length, []),
    }
  }

  const searchPlans = createSearchPlans(params)

  try {
    const responses = await Promise.all(searchPlans.map(async ({ query, category }) => {
      const requestUrl = new URL(proxyUrl, window.location.origin)
      requestUrl.searchParams.set('query', query)
      requestUrl.searchParams.set('region', params.region)
      requestUrl.searchParams.set('categories', params.categories.join(','))
      if (params.location) {
        requestUrl.searchParams.set('lat', String(params.location.lat))
        requestUrl.searchParams.set('lng', String(params.location.lng))
        requestUrl.searchParams.set('radius', '15000')
      }
      const response = await fetch(requestUrl.toString())
      if (!response.ok) throw new Error(`Kakao Local proxy failed: ${response.status}`)
      const data = await response.json() as KakaoLocalResponse
      return (data.documents || [])
        .filter((document) => isRelevantDocument(document, category, query))
        .slice(0, 4)
        .map((document, index) => normalizeKakaoDocument(document, index, category, params.region))
    }))
    const kakaoPlaces = responses.flat()
    const seen = new Set<string>()
    const mergedPlaces = [...fallbackPlaces, ...kakaoPlaces]
      .filter((place) => {
        const key = `${place.name}-${place.address}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      .slice(0, 24)

    return {
      mode: 'kakao-local',
      places: kakaoPlaces.length ? mergedPlaces : fallbackPlaces,
      message: kakaoPlaces.length
        ? '운영자 추천 충북 장소와 카카오 Local 검색 결과를 함께 표시 중입니다.'
        : '카카오 Local 검색 결과가 없어 MVP 장소 데이터를 표시 중입니다.',
      meta: createSearchMeta(
        params,
        kakaoPlaces.length,
        fallbackPlaces.length,
        kakaoPlaces.length ? mergedPlaces.length : fallbackPlaces.length,
        searchPlans.map((plan) => plan.query),
      ),
    }
  } catch {
    return {
      mode: 'kakao-local-error',
      places: fallbackPlaces,
      message: '카카오 Local 검색 연결에 실패해 MVP 장소 데이터로 표시 중입니다.',
      meta: createSearchMeta(params, 0, fallbackPlaces.length, fallbackPlaces.length, searchPlans.map((plan) => plan.query)),
    }
  }
}
