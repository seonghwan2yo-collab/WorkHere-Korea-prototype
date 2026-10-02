import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { List, MapPin, Maximize, Route } from 'lucide-react'
import { initialDailyFeeds, initialPosts } from '../../data'
import type { Place } from '../../types'

type KakaoMapViewProps = {
  places: Place[]
  activePlace?: Place
  region: string
  isSearching?: boolean
  emptyTitle?: string
  emptyDescription?: string
  controls?: ReactNode
  onSelect: (place: Place) => void
  onLocate: () => void
  onOpenRegion: () => void
  onReportPlace: () => void
  onFocusList?: () => void
  onReset?: () => void
}

type KakaoLatLng = {
  getLat: () => number
  getLng: () => number
}

type KakaoMap = {
  getLevel: () => number
  relayout: () => void
  setCenter: (latlng: KakaoLatLng) => void
  setBounds: (bounds: KakaoLatLngBounds) => void
  setLevel: (level: number, options?: { anchor?: KakaoLatLng }) => void
}

type KakaoLatLngBounds = {
  extend: (latlng: KakaoLatLng) => void
}

type KakaoCustomOverlay = {
  setMap: (map: KakaoMap | null) => void
  setZIndex?: (zIndex: number) => void
}

type KakaoMapsApi = {
  event: {
    addListener: (target: KakaoMap, type: string, callback: () => void) => void
    removeListener: (target: KakaoMap, type: string, callback: () => void) => void
  }
  LatLng: new (lat: number, lng: number) => KakaoLatLng
  LatLngBounds: new () => KakaoLatLngBounds
  Map: new (container: HTMLElement, options: { center: KakaoLatLng; level: number }) => KakaoMap
  CustomOverlay: new (options: { clickable: boolean; content: HTMLElement; map: KakaoMap; position: KakaoLatLng; xAnchor: number; yAnchor: number; zIndex?: number }) => KakaoCustomOverlay
  load: (callback: () => void) => void
}

type KakaoGlobal = {
  maps: KakaoMapsApi
}

declare global {
  interface Window {
    kakao?: KakaoGlobal
  }

}

let kakaoSdkPromise: Promise<KakaoGlobal> | null = null

type MarkerCategory = {
  key: string
  label: string
  shortLabel: string
}

type PlaceCluster = {
  id: string
  places: Place[]
  lat: number
  lng: number
  label?: string
  kind?: 'distance' | 'region'
}

type CountryBadge = {
  code: string
  label: string
}

const CLUSTER_CATEGORY_PRIORITY: Record<string, number> = {
  support: 0,
  medical: 1,
  pharmacy: 2,
  admin: 3,
  money: 4,
  food: 5,
  dense: 6,
  community: 7,
}

const COUNTRY_LABELS: Record<string, string> = {
  VN: '베트남',
  CN: '중국',
  UZ: '우즈베키스탄',
}

const REGION_COUNTRY_HINTS: Record<string, CountryBadge[]> = {
  '경기 안산': [
    { code: 'VN', label: '베트남' },
    { code: 'CN', label: '중국' },
    { code: 'UZ', label: '우즈베키스탄' },
  ],
  '경기 시흥': [
    { code: 'VN', label: '베트남' },
    { code: 'UZ', label: '우즈베키스탄' },
  ],
  '충북 청주': [
    { code: 'VN', label: '베트남' },
    { code: 'UZ', label: '우즈베키스탄' },
  ],
  '충북 음성': [
    { code: 'VN', label: '베트남' },
    { code: 'UZ', label: '우즈베키스탄' },
  ],
  '경남 김해': [
    { code: 'VN', label: '베트남' },
    { code: 'CN', label: '중국' },
  ],
  '충남 천안': [
    { code: 'UZ', label: '우즈베키스탄' },
    { code: 'VN', label: '베트남' },
  ],
}

const feedCountryById = new Map(initialDailyFeeds.map((feed) => [feed.id, feed.countryCode || countryCodeFromNationality(feed.nationality)]))
const postCountryById = new Map(initialPosts.map((post) => [post.id, post.countryCode]))

function countryCodeFromNationality(nationality: string | undefined) {
  if (!nationality) return undefined
  if (nationality.includes('Vietnam')) return 'VN'
  if (nationality.includes('China')) return 'CN'
  if (nationality.includes('Uzbekistan')) return 'UZ'
  return undefined
}

function normalizeCountryBadge(code: string | undefined): CountryBadge | null {
  if (!code) return null
  const normalized = code.toUpperCase()
  if (!COUNTRY_LABELS[normalized]) return null
  return { code: normalized, label: COUNTRY_LABELS[normalized] }
}

function addCountryBadge(list: CountryBadge[], code: string | undefined) {
  const badge = normalizeCountryBadge(code)
  if (!badge || list.some((item) => item.code === badge.code)) return
  list.push(badge)
}

function getPlaceCountryBadges(place: Place) {
  const badges: CountryBadge[] = []
  place.linkedFeedIds?.forEach((feedId) => addCountryBadge(badges, feedCountryById.get(feedId)))
  place.linkedPostIds?.forEach((postId) => addCountryBadge(badges, postCountryById.get(postId)))
  if (!badges.length) {
    REGION_COUNTRY_HINTS[place.region]?.forEach((badge) => addCountryBadge(badges, badge.code))
  }
  return badges
}

function getClusterCountryBadges(cluster: PlaceCluster) {
  const badges: CountryBadge[] = []
  cluster.places.forEach((place) => {
    getPlaceCountryBadges(place).forEach((badge) => addCountryBadge(badges, badge.code))
  })
  return badges
}

function markerCategory(place: Place): MarkerCategory {
  const category = place.category
  if (category.includes('병원')) return { key: 'medical', label: '병원', shortLabel: '병원' }
  if (category.includes('약국')) return { key: 'pharmacy', label: '약국', shortLabel: '약국' }
  if (category.includes('상담') || category.includes('안전') || category.includes('산재')) return { key: 'support', label: '상담', shortLabel: '상담' }
  if (category.includes('송금')) return { key: 'money', label: '송금', shortLabel: '송금' }
  if (category.includes('행정')) return { key: 'admin', label: '행정', shortLabel: '행정' }
  if (category.includes('음식') || category.includes('마트') || category.includes('통신')) return { key: 'food', label: '생활', shortLabel: '생활' }
  if (category.includes('밀집')) return { key: 'dense', label: '외국인 생활권', shortLabel: '생활권' }
  if (category.includes('커뮤니티')) return { key: 'community', label: '커뮤니티', shortLabel: '커뮤' }
  return { key: 'community', label: '커뮤니티', shortLabel: '커뮤' }
}

function createMarkerContent(place: Place, active: boolean) {
  const category = markerCategory(place)
  const button = document.createElement('button')
  button.type = 'button'
  button.className = `kakao-place-marker ${category.key} ${active ? 'active' : ''}`
  button.dataset.placeId = String(place.id)
  button.setAttribute('aria-label', `${place.name} 선택`)
  button.title = place.name

  const badge = document.createElement('span')
  badge.className = 'kakao-place-marker-badge'
  badge.textContent = category.shortLabel

  const label = document.createElement('span')
  label.className = 'kakao-place-marker-label'
  label.textContent = place.name

  button.appendChild(badge)
  button.appendChild(label)

  return button
}

function createClusterContent(cluster: PlaceCluster) {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = `kakao-place-cluster ${cluster.kind === 'region' ? 'region-cluster' : ''}`
  button.dataset.clusterId = cluster.id
  button.setAttribute('aria-label', `${cluster.label || '주변 장소'} ${cluster.places.length}개 장소 보기`)
  button.title = `${cluster.label || '주변 장소'} ${cluster.places.length}개`

  const count = document.createElement('span')
  count.className = 'kakao-place-cluster-count'
  count.textContent = `${cluster.places.length}`

  const label = document.createElement('span')
  label.className = 'kakao-place-cluster-label'
  label.textContent = cluster.label || '주변 장소'

  button.appendChild(count)
  button.appendChild(label)


  return button
}

function loadKakaoSdk(appKey: string) {
  if (window.kakao?.maps?.Map) return Promise.resolve(window.kakao)
  if (kakaoSdkPromise) return kakaoSdkPromise

  kakaoSdkPromise = new Promise<KakaoGlobal>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>('script[data-workhere-kakao-map="true"]')
    const script = existingScript || document.createElement('script')
    const timeout = window.setTimeout(() => reject(new Error('Kakao Maps SDK connection timed out.')), 20000)
    const loadMaps = () => {
      if (!window.kakao?.maps) {
        window.clearTimeout(timeout)
        reject(new Error('Kakao Maps SDK loaded without maps API.'))
        return
      }
      window.kakao.maps.load(() => {
        window.clearTimeout(timeout)
        resolve(window.kakao as KakaoGlobal)
      })
    }
    if (window.kakao?.maps) {
      loadMaps()
      return
    }
    script.async = true
    script.dataset.workhereKakaoMap = 'true'
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(appKey)}&autoload=false&libraries=services`
    script.addEventListener('load', loadMaps, { once: true })
    script.addEventListener('error', () => {
      window.clearTimeout(timeout)
      reject(new Error('Failed to load Kakao Maps SDK.'))
    }, { once: true })
    if (!existingScript) document.head.appendChild(script)
  }).catch((error) => {
    kakaoSdkPromise = null
    document.querySelector('script[data-workhere-kakao-map="true"]')?.remove()
    throw error
  })

  return kakaoSdkPromise
}

function clusterThresholdKm(level: number) {
  if (level <= 2) return 0
  if (level === 3) return 0.18
  if (level === 4) return 0.45
  if (level === 5) return 1.05
  if (level === 6) return 2.2
  return 4.8
}

function getPlaceDistanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const earthRadiusKm = 6371
  const latDelta = ((b.lat - a.lat) * Math.PI) / 180
  const lngDelta = ((b.lng - a.lng) * Math.PI) / 180
  const startLat = (a.lat * Math.PI) / 180
  const endLat = (b.lat * Math.PI) / 180
  const haversine = Math.sin(latDelta / 2) ** 2
    + Math.cos(startLat) * Math.cos(endLat) * Math.sin(lngDelta / 2) ** 2
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
}

function placePriorityScore(place: Place) {
  const category = markerCategory(place)
  const sourceScore = place.source === 'operator' ? 0 : 80
  const friendlyScore = place.foreignerFriendly ? 0 : 40
  const categoryScore = CLUSTER_CATEGORY_PRIORITY[category.key] ?? 9
  const distanceScore = place.distanceKm ?? 99
  return sourceScore + friendlyScore + (categoryScore * 10) + distanceScore
}

function sortClusterPlaces(places: Place[]) {
  return [...places].sort((a, b) => placePriorityScore(a) - placePriorityScore(b) || a.name.localeCompare(b.name, 'ko'))
}

function normalizeCluster(cluster: PlaceCluster) {
  cluster.places = sortClusterPlaces(cluster.places)
  cluster.id = cluster.places.length > 1
    ? `cluster-${cluster.places.map((clusterPlace) => clusterPlace.id).sort((a, b) => a - b).join('-')}`
    : `single-${cluster.places[0].id}`
  return cluster
}

function buildPlaceClusters(places: Place[], activePlace: Place | undefined, level: number): PlaceCluster[] {
  const thresholdKm = clusterThresholdKm(level)
  if (!thresholdKm) {
    return places.map((place) => ({
      id: `single-${place.id}`,
      places: [place],
      lat: place.lat,
      lng: place.lng,
    }))
  }

  const clusters: PlaceCluster[] = []

  places.forEach((place) => {
    if (activePlace?.id === place.id) {
      clusters.push({ id: `single-${place.id}`, places: [place], lat: place.lat, lng: place.lng })
      return
    }

    const cluster = clusters.find((item) => {
      if (item.places.some((clusterPlace) => activePlace?.id === clusterPlace.id)) return false
      return getPlaceDistanceKm(place, item) <= thresholdKm
    })

    if (!cluster) {
      clusters.push({ id: `single-${place.id}`, places: [place], lat: place.lat, lng: place.lng })
      return
    }

    const nextCount = cluster.places.length + 1
    cluster.lat = ((cluster.lat * cluster.places.length) + place.lat) / nextCount
    cluster.lng = ((cluster.lng * cluster.places.length) + place.lng) / nextCount
    cluster.places.push(place)
    normalizeCluster(cluster)
  })

  return clusters.map(normalizeCluster)
}

function buildRegionClusters(places: Place[]): PlaceCluster[] {
  const grouped = places.reduce<Record<string, Place[]>>((acc, place) => {
    const key = place.region || '기타 지역'
    acc[key] = [...(acc[key] || []), place]
    return acc
  }, {})

  return Object.entries(grouped)
    .map(([regionName, regionPlaces]) => {
      const sortedPlaces = sortClusterPlaces(regionPlaces)
      const center = getCenter(sortedPlaces)
      return {
        id: `region-${regionName}`,
        label: regionName,
        kind: 'region' as const,
        places: sortedPlaces,
        lat: center.lat,
        lng: center.lng,
      }
    })
    .sort((a, b) => b.places.length - a.places.length || a.label.localeCompare(b.label, 'ko'))
}

function getCenter(places: Place[]) {
  const validPlaces = places.filter((place) => Number.isFinite(place.lat) && Number.isFinite(place.lng))
  if (!validPlaces.length) return { lat: 36.713, lng: 127.429 }

  const total = validPlaces.reduce((acc, place) => ({
    lat: acc.lat + place.lat,
    lng: acc.lng + place.lng,
  }), { lat: 0, lng: 0 })

  return {
    lat: total.lat / validPlaces.length,
    lng: total.lng / validPlaces.length,
  }
}

function getOverviewLevel(placeCount: number, region?: string) {
  if (region === '전체 지역') return 13
  if (placeCount <= 1) return 5
  if (placeCount <= 3) return 6
  if (placeCount <= 8) return 7
  if (placeCount <= 24) return 8
  if (placeCount <= 60) return 9
  return 10
}

export function KakaoMapView({ places, activePlace, region, isSearching = false, emptyTitle, emptyDescription, controls, onSelect, onLocate, onOpenRegion, onReportPlace, onFocusList, onReset }: KakaoMapViewProps) {
  const frameRef = useRef<HTMLDivElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<KakaoMap | null>(null)
  const markerRefs = useRef<KakaoCustomOverlay[]>([])
  const gestureRef = useRef<{ x: number; y: number; moved: boolean; button: HTMLButtonElement | null; selected: boolean } | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [retryCount, setRetryCount] = useState(0)
  const [renderedMarkerCount, setRenderedMarkerCount] = useState(0)
  const [clusterCount, setClusterCount] = useState(0)
  const [selectedCluster, setSelectedCluster] = useState<PlaceCluster | null>(null)
  const [mapLevel, setMapLevel] = useState(5)
  const [mapToast, setMapToast] = useState('')
  const toastTimerRef = useRef<number | null>(null)
  const appKey = import.meta.env.VITE_KAKAO_MAP_KEY || import.meta.env.VITE_MAP_API_KEY || ''
  const center = useMemo(() => getCenter(places), [places])
  const validPlaces = useMemo(
    () => places.filter((place) => Number.isFinite(place.lat) && Number.isFinite(place.lng)),
    [places],
  )
  const placeClusters = useMemo(
    () => region === '전체 지역'
      ? buildRegionClusters(validPlaces)
      : buildPlaceClusters(validPlaces, activePlace, mapLevel),
    [activePlace, mapLevel, region, validPlaces],
  )

  useEffect(() => {
    if (!appKey || !containerRef.current) return

    let cancelled = false
    setStatus('loading')

    loadKakaoSdk(appKey)
      .then((kakao) => {
        if (cancelled || !containerRef.current) return
        const mapCenter = new kakao.maps.LatLng(center.lat, center.lng)
        const map = new kakao.maps.Map(containerRef.current, {
          center: mapCenter,
          level: 5,
        })
        mapRef.current = map
        setMapLevel(map.getLevel())
        setStatus('ready')
      })
      .catch(() => {
        if (!cancelled) setStatus('error')
      })

    return () => {
      cancelled = true
      markerRefs.current.forEach((marker) => marker.setMap(null))
      markerRefs.current = []
      mapRef.current = null
    }
  }, [appKey, retryCount])

  useEffect(() => {
    if (!window.kakao?.maps || !mapRef.current || status !== 'ready') return

    const kakao = window.kakao
    const map = mapRef.current
    const syncLevel = () => setMapLevel(map.getLevel())
    kakao.maps.event.addListener(map, 'zoom_changed', syncLevel)
    kakao.maps.event.addListener(map, 'idle', syncLevel)

    return () => {
      kakao.maps.event.removeListener(map, 'zoom_changed', syncLevel)
      kakao.maps.event.removeListener(map, 'idle', syncLevel)
    }
  }, [status])

  useEffect(() => {
    if (!mapRef.current || status !== 'ready') return

    let frameId = 0
    const relayoutVisibleMap = () => {
      window.cancelAnimationFrame(frameId)
      frameId = window.requestAnimationFrame(() => {
        mapRef.current?.relayout()
      })
    }

    const observer = new ResizeObserver(relayoutVisibleMap)
    if (containerRef.current) observer.observe(containerRef.current)
    relayoutVisibleMap()

    return () => {
      window.cancelAnimationFrame(frameId)
      observer.disconnect()
    }
  }, [status])

  const zoomToCluster = (cluster: PlaceCluster) => {
    if (!window.kakao?.maps || !mapRef.current) return

    const kakao = window.kakao
    const map = mapRef.current
    const anchor = new kakao.maps.LatLng(cluster.lat, cluster.lng)
    const nextLevel = Math.max(2, map.getLevel() - 1)
    map.setCenter(anchor)
    map.setLevel(nextLevel, { anchor })
    setMapLevel(nextLevel)
    showMapToast(`${cluster.label || '묶음 장소'}를 확대했습니다`)
  }

  const showMapToast = (message: string) => {
    setMapToast(message)
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current)
    }
    toastTimerRef.current = window.setTimeout(() => {
      setMapToast('')
      toastTimerRef.current = null
    }, 1800)
  }

  const fitMapToPlaces = () => {
    if (!window.kakao?.maps || !mapRef.current) return

    const kakao = window.kakao
    const map = mapRef.current
    map.relayout()
    setSelectedCluster(null)

    if (region === '전체 지역') {
      const koreaCenter = new kakao.maps.LatLng(36.45, 127.85)
      const overviewLevel = getOverviewLevel(validPlaces.length, region)
      map.setCenter(koreaCenter)
      map.setLevel(overviewLevel)
      setMapLevel(overviewLevel)
      showMapToast('전국 권역이 한눈에 보이도록 맞췄습니다')
      return
    }

    if (validPlaces.length > 1) {
      const bounds = new kakao.maps.LatLngBounds()
      validPlaces.forEach((place) => bounds.extend(new kakao.maps.LatLng(place.lat, place.lng)))
      map.setBounds(bounds)
      const overviewLevel = Math.max(map.getLevel(), getOverviewLevel(validPlaces.length, region))
      map.setLevel(overviewLevel)
      setMapLevel(overviewLevel)
      showMapToast(`${region} 장소가 모두 보이도록 맞췄습니다`)
      return
    }

    if (validPlaces.length === 1) {
      const place = validPlaces[0]
      const centerPoint = new kakao.maps.LatLng(place.lat, place.lng)
      map.setCenter(centerPoint)
      map.setLevel(getOverviewLevel(1, region))
      setMapLevel(getOverviewLevel(1, region))
      showMapToast('선택 지역의 장소 1곳을 표시합니다')
      return
    }

    map.setCenter(new kakao.maps.LatLng(center.lat, center.lng))
    map.setLevel(8)
    setMapLevel(8)
    showMapToast('표시할 장소가 없어 기준 위치로 이동했습니다')
  }

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!window.kakao?.maps || !mapRef.current || status !== 'ready') return

    const kakao = window.kakao
    const map = mapRef.current
    markerRefs.current.forEach((marker) => marker.setMap(null))

    markerRefs.current = placeClusters
      .map((cluster) => {
        const isCluster = cluster.kind === 'region' || cluster.places.length > 1
        const place = cluster.places[0]
        const marker = new kakao.maps.CustomOverlay({
          clickable: true,
          content: isCluster
            ? createClusterContent(cluster)
            : createMarkerContent(place, activePlace?.id === place.id),
          map,
          position: new kakao.maps.LatLng(cluster.lat, cluster.lng),
          xAnchor: 0.5,
          yAnchor: isCluster ? 0.5 : 1,
          zIndex: isCluster ? 2000 : activePlace?.id === place.id ? 60 : 40,
        })
        marker.setZIndex?.(isCluster ? 2000 : activePlace?.id === place.id ? 60 : 40)
        return marker
      })

    map.relayout()
    setRenderedMarkerCount(placeClusters.reduce((count, cluster) => count + cluster.places.length, 0))
    setClusterCount(placeClusters.filter((cluster) => cluster.kind === 'region' || cluster.places.length > 1).length)
  }, [activePlace?.id, placeClusters, status])

  useEffect(() => {
    setSelectedCluster(null)
  }, [activePlace?.id, places])

  useEffect(() => {
    const frame = frameRef.current
    if (!frame) return

    const beginGesture = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null
      gestureRef.current = { x: event.clientX, y: event.clientY, moved: false, button: target?.closest<HTMLButtonElement>('.kakao-place-cluster, .kakao-place-marker') || null, selected: false }
    }
    const moveGesture = (event: PointerEvent) => {
      const gesture = gestureRef.current
      if (!gesture) return
      if (Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) > 8) {
        gesture.moved = true
      }
    }
    const cancelGesture = () => {
      const gesture = gestureRef.current
      if (gesture) gesture.moved = true
    }
    const selectButton = (button: HTMLButtonElement) => {
      const cluster = placeClusters.find((item) => item.id === button.dataset.clusterId)
      if (cluster) setSelectedCluster(cluster)
      else {
        const place = places.find((item) => String(item.id) === button.dataset.placeId)
        if (place) onSelect(place)
      }
    }
    const endGesture = (event: PointerEvent) => {
      moveGesture(event)
      const gesture = gestureRef.current
      const target = event.target as HTMLElement | null
      if (!gesture?.button || gesture.moved || target?.closest('.kakao-place-cluster, .kakao-place-marker') !== gesture.button) return
      gesture.selected = true
      event.preventDefault()
      event.stopPropagation()
      selectButton(gesture.button)
    }
    // A map pan can end on a marker; only an intentional tap should select it.
    const guardMarkerClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      const button = target?.closest<HTMLButtonElement>('.kakao-place-cluster, .kakao-place-marker')
      if (!button) return
      event.preventDefault()
      event.stopPropagation()
      if (event.detail !== 0 && (gestureRef.current?.moved || gestureRef.current?.selected)) return
      selectButton(button)
    }
    frame.addEventListener('pointerdown', beginGesture, true)
    frame.addEventListener('pointermove', moveGesture, true)
    frame.addEventListener('pointerup', endGesture, true)
    frame.addEventListener('pointercancel', cancelGesture, true)
    frame.addEventListener('click', guardMarkerClick, true)

    return () => {
      frame.removeEventListener('pointerdown', beginGesture, true)
      frame.removeEventListener('pointermove', moveGesture, true)
      frame.removeEventListener('pointerup', endGesture, true)
      frame.removeEventListener('pointercancel', cancelGesture, true)
      frame.removeEventListener('click', guardMarkerClick, true)
    }
  }, [placeClusters, places, onSelect])

  useEffect(() => {
    if (!window.kakao?.maps || !mapRef.current || status !== 'ready') return

    const kakao = window.kakao
    const map = mapRef.current
    map.relayout()

    if (activePlace && Number.isFinite(activePlace.lat) && Number.isFinite(activePlace.lng)) {
      map.setCenter(new kakao.maps.LatLng(activePlace.lat, activePlace.lng))
      if (map.getLevel() < 4) {
        map.setLevel(4)
        setMapLevel(4)
      }
      return
    }

    if (validPlaces.length > 1) {
      const bounds = new kakao.maps.LatLngBounds()
      validPlaces.forEach((place) => bounds.extend(new kakao.maps.LatLng(place.lat, place.lng)))
      map.setBounds(bounds)
      const overviewLevel = Math.max(map.getLevel(), getOverviewLevel(validPlaces.length, region))
      map.setLevel(overviewLevel)
      setMapLevel(overviewLevel)
      return
    }

    if (validPlaces.length === 1) {
      map.setCenter(new kakao.maps.LatLng(validPlaces[0].lat, validPlaces[0].lng))
      map.setLevel(getOverviewLevel(1, region))
      setMapLevel(getOverviewLevel(1, region))
    }
  }, [activePlace, center.lat, center.lng, region, status, validPlaces])

  return (
    <figure className="kakao-map-view">
      <div className={`kakao-map-frame ${region === '전체 지역' ? 'overview-mode' : 'local-mode'}`} ref={frameRef}>
        {!controls ? <div className="kakao-map-header">
          <span><MapPin size={14} />{region}</span>
          <button type="button" onClick={onLocate}><Route size={14} />현재 위치</button>
        </div> : null}
        {controls ? <div className="life-map-inner-controls kakao">{controls}</div> : null}
        <div ref={containerRef} className="kakao-map-canvas" aria-label={`${region} 카카오 지도`} />
        {status === 'ready' && isSearching ? (
          <div className="life-map-state-overlay loading compact" aria-live="polite">
            <strong>장소를 찾고 있습니다</strong>
            <span>카카오 Local과 운영자 추천 데이터를 확인 중입니다.</span>
          </div>
        ) : null}
        {status === 'ready' && !isSearching && places.length === 0 ? (
          <div className="life-map-state-overlay empty" aria-live="polite">
            <strong>{emptyTitle || '조건에 맞는 장소가 없습니다.'}</strong>
            <span>{emptyDescription || '검색어를 줄이거나 필터를 초기화해보세요.'}</span>
            <div className="life-map-state-actions">
              {onReset ? <button type="button" onClick={onReset}>필터 초기화</button> : null}
              <button type="button" onClick={onOpenRegion}>지역 바꾸기</button>
              <button type="button" onClick={onReportPlace}>장소 제보</button>
            </div>
          </div>
        ) : null}
        {status !== 'ready' ? (
          <div className={`kakao-map-status ${status}`}>
            <strong>{status === 'loading' ? '카카오 지도를 불러오는 중입니다' : '카카오 지도를 불러오지 못했습니다'}</strong>
            <span>{status === 'loading' ? '지도 SDK 연결을 준비하고 있습니다.' : '도메인 등록과 JavaScript 키를 확인해주세요.'}</span>
            {status === 'error' ? <button type="button" className="secondary" onClick={() => setRetryCount((count) => count + 1)}>다시 연결</button> : null}
          </div>
        ) : null}
        {mapToast ? <div className="kakao-map-toast" aria-live="polite">{mapToast}</div> : null}
      </div>
      {status === 'ready' ? (
        <div className="kakao-map-footer" aria-live="polite">
          <strong>{selectedCluster ? `${selectedCluster.label || '묶음 장소'} ${selectedCluster.places.length}곳` : activePlace ? activePlace.name : region === '전체 지역' ? `전국 권역 ${clusterCount}곳` : `지도 장소 ${renderedMarkerCount}곳`}</strong>
          <div className="kakao-map-footer-actions">
            {onFocusList ? <button type="button" onClick={onFocusList}><List size={16} />목록 보기</button> : null}
            <button type="button" onClick={fitMapToPlaces}><Maximize size={16} />전체 보기</button>
          </div>
        </div>
      ) : null}
        {selectedCluster ? (
          <div className="kakao-cluster-panel" aria-label="묶음 장소 목록">
            <div className="kakao-cluster-panel-head">
              <div>
                <strong>{selectedCluster.label || '묶음 장소'} TOP {Math.min(selectedCluster.places.length, 5)}</strong>
                <span>{selectedCluster.kind === 'region' ? '이 지역의 생활도움 장소를 우선순위로 보여드립니다.' : '외국인 친화·상담/의료·거리 기준으로 먼저 보여드립니다.'}</span>
                {getClusterCountryBadges(selectedCluster).length ? (
                  <div className="kakao-cluster-panel-countries" aria-label="묶음 장소 연결 국가">
                    <small>활동 국가</small>
                    {getClusterCountryBadges(selectedCluster).slice(0, 4).map((country) => (
                      <span key={country.code} className={`kakao-country-badge ${country.code.toLowerCase()}`} title={country.label}>
                        {country.code}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
              <button type="button" onClick={() => setSelectedCluster(null)} aria-label="묶음 장소 닫기">×</button>
            </div>
            <div className="kakao-cluster-panel-list">
              {selectedCluster.places.slice(0, 5).map((place, index) => {
                const category = markerCategory(place)
                const countryBadges = getPlaceCountryBadges(place).slice(0, 3)
                return (
                  <button
                    key={place.id}
                    type="button"
                    onClick={() => {
                      setSelectedCluster(null)
                      onSelect(place)
                    }}
                  >
                    <span className="kakao-cluster-rank">{index + 1}</span>
                    <span>
                      <strong>
                        <span>{place.name}</span>
                        <span className={`kakao-cluster-mini-badge ${category.key}`}>{category.shortLabel}</span>
                      </strong>
                      <small>
                        {countryBadges.length ? (
                          <span className="kakao-cluster-place-countries" aria-label="연결된 국가">
                            {countryBadges.map((country) => (
                              <span key={country.code} className={`kakao-country-badge ${country.code.toLowerCase()}`} title={country.label}>
                                {country.code}
                              </span>
                            ))}
                          </span>
                        ) : null}
                        <span>{place.category} · {place.distanceKm?.toFixed(1) || '-'}km</span>
                      </small>
                    </span>
                  </button>
                )
              })}
            </div>
            <div className="kakao-cluster-panel-actions">
              <button type="button" onClick={() => zoomToCluster(selectedCluster)}>확대해서 보기</button>
              {onFocusList ? <button type="button" onClick={() => { showMapToast(`${selectedCluster.label || '묶음 장소'} 목록으로 이동합니다`); onFocusList() }}>아래 목록에서 보기</button> : null}
            </div>
          </div>
        ) : null}
      <figcaption>카카오 지도 SDK 기반 실제 지도 영역입니다. 장소 데이터는 현재 MVP 데이터를 마커로 표시합니다.</figcaption>
    </figure>
  )
}
