import {
  Banknote,
  Building,
  HeartHandshake,
  HeartPulse,
  MapPin,
  MessageCircle,
  Pill,
  Route,
  ShoppingBag,
} from 'lucide-react'
import type { CSSProperties } from 'react'
import type { ReactNode } from 'react'
import type { Place } from '../../types'
import { KakaoMapView } from './KakaoMapView'
import { StaticMapView } from './StaticMapView'

type LifeMapViewProps = {
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

type MapCategoryId = 'hospital' | 'pharmacy' | 'counseling' | 'remittance' | 'admin' | 'food' | 'dense' | 'community'

type MapCategory = {
  id: MapCategoryId
  label: string
  markerClass: string
  icon: typeof HeartPulse
}

const mapCategories: MapCategory[] = [
  { id: 'hospital', label: '병원', markerClass: 'medical', icon: HeartPulse },
  { id: 'pharmacy', label: '약국', markerClass: 'pharmacy', icon: Pill },
  { id: 'counseling', label: '상담', markerClass: 'support', icon: HeartHandshake },
  { id: 'remittance', label: '송금', markerClass: 'money', icon: Banknote },
  { id: 'admin', label: '행정', markerClass: 'admin', icon: Building },
  { id: 'food', label: '생활', markerClass: 'food', icon: ShoppingBag },
  { id: 'dense', label: '밀집지역', markerClass: 'dense', icon: MessageCircle },
  { id: 'community', label: '커뮤니티', markerClass: 'community', icon: MessageCircle },
]

const categoryAnchors: Record<MapCategoryId, [number, number]> = {
  hospital: [57, 48],
  pharmacy: [63, 55],
  counseling: [48, 42],
  remittance: [54, 66],
  admin: [69, 43],
  food: [44, 62],
  dense: [72, 61],
  community: [72, 61],
}

const MAP_OVERLAY_SAFE_BOTTOM_PERCENT = 34
const SELECTED_MARKER_MAX_Y = 100 - MAP_OVERLAY_SAFE_BOTTOM_PERCENT - 8
const NON_SELECTED_VISIBLE_MAX_Y = 100 - MAP_OVERLAY_SAFE_BOTTOM_PERCENT

function getAdjustedMarkerPosition(position: { x: number; y: number }, active: boolean, hasSelection: boolean) {
  if (!hasSelection || !active) return position
  return {
    ...position,
    y: Math.min(position.y, SELECTED_MARKER_MAX_Y),
  }
}

function isObscuredBySelectedCard(position: { x: number; y: number }, active: boolean, hasSelection: boolean) {
  return hasSelection && !active && position.y > NON_SELECTED_VISIBLE_MAX_Y
}

function mapCategory(place: Place) {
  const category = place.category
  if (category.includes('병원')) return mapCategories[0]
  if (category.includes('약국')) return mapCategories[1]
  if (category.includes('상담') || category.includes('안전') || category.includes('산재')) return mapCategories[2]
  if (category.includes('송금')) return mapCategories[3]
  if (category.includes('행정')) return mapCategories[4]
  if (category.includes('음식') || category.includes('마트') || category.includes('통신')) return mapCategories[5]
  if (category.includes('밀집')) return mapCategories[6]
  return mapCategories[7]
}

function markerPosition(place: Place, index: number) {
  const withMap = place as Place & { mapX?: number; mapY?: number }
  if (typeof withMap.mapX === 'number' && typeof withMap.mapY === 'number') {
    return { x: withMap.mapX, y: withMap.mapY }
  }
  const category = mapCategory(place)
  const [baseX, baseY] = categoryAnchors[category.id]
  const spreadX = (((place.id * 17 + index * 11) % 25) - 12) * 0.9
  const spreadY = (((place.id * 13 + index * 7) % 21) - 10) * 0.9
  return {
    x: Math.min(88, Math.max(12, baseX + spreadX)),
    y: Math.min(82, Math.max(16, baseY + spreadY)),
  }
}

function categorySummary(places: Place[]) {
  return mapCategories
    .map((category) => ({
      ...category,
      count: places.filter((place) => mapCategory(place).id === category.id).length,
    }))
    .filter((category) => category.count > 0)
}

export function LifeMapView({ places, activePlace, region, isSearching = false, emptyTitle, emptyDescription, controls, onSelect, onLocate, onOpenRegion, onReportPlace, onFocusList, onReset }: LifeMapViewProps) {
  const currentPlace = activePlace && places.some((place) => place.id === activePlace.id) ? activePlace : undefined
  const hasSelectedCard = Boolean(currentPlace)
  const summaryLabel = places.length > 0
    ? `주변 장소 ${places.length}개`
    : '조건에 맞는 장소가 없습니다'
  const categoryCount = categorySummary(places).length
  const mapProvider = import.meta.env.VITE_MAP_PROVIDER
  const kakaoMapKey = import.meta.env.VITE_KAKAO_MAP_KEY || import.meta.env.VITE_MAP_API_KEY
  const useKakaoMap = mapProvider === 'kakao' && Boolean(kakaoMapKey)

  if (useKakaoMap) {
    return (
      <KakaoMapView
        activePlace={currentPlace}
        emptyDescription={emptyDescription}
        emptyTitle={emptyTitle}
        controls={controls}
        isSearching={isSearching}
        places={places}
        region={region}
        onLocate={onLocate}
        onOpenRegion={onOpenRegion}
        onFocusList={onFocusList}
        onReportPlace={onReportPlace}
        onReset={onReset}
        onSelect={onSelect}
      />
    )
  }

  return (
    <StaticMapView
      imageUrl="/mock/maps/ochang-skyview.png"
      alt={`${region} 생활도움 장소 샘플 지도`}
      caption="현재는 정적 지도 이미지에 생활도움 장소를 표시한 MVP 예시 화면입니다."
      label="Life Map MVP"
      pannable
    >
      <div
        className={`life-map-overlay ${hasSelectedCard ? 'has-selected-card' : ''}`}
        aria-label="생활도움 장소 마커"
        style={{ '--map-overlay-safe-bottom': `${MAP_OVERLAY_SAFE_BOTTOM_PERCENT}%` } as CSSProperties}
      >
        {!controls ? <div className="life-map-region-chip"><MapPin size={14} />{region} · 오창읍 주변</div> : null}
        {!controls ? <button className="life-map-locate-chip" type="button" onClick={onLocate}><Route size={14} />현재 위치</button> : null}
        {controls ? <div className="life-map-inner-controls">{controls}</div> : null}
        {isSearching ? (
          <div className="life-map-state-overlay loading" aria-live="polite">
            <strong>장소를 찾고 있습니다</strong>
            <span>선택한 지역과 필터 기준으로 결과를 다시 불러오는 중입니다.</span>
          </div>
        ) : places.length === 0 ? (
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
        <div className="life-map-legend" aria-label="현재 필터 결과">
          {categorySummary(places).map((category) => (
            <span className={`life-map-legend-chip ${category.markerClass}`} key={category.id}>{category.label} {category.count}곳</span>
          ))}
          <span className="life-map-legend-chip friendly">지원 외국인 친화</span>
        </div>
        <div className={`life-map-summary-bar ${places.length === 0 ? 'empty' : ''} ${currentPlace ? 'selected' : ''}`} aria-live="polite">
          <strong>{currentPlace ? currentPlace.name : summaryLabel}</strong>
          <span>
            {currentPlace
              ? `${currentPlace.category} · ${currentPlace.region} · ${currentPlace.distanceKm?.toFixed(1) || '-'}km`
              : places.length > 0
                ? `${categoryCount}개 유형의 생활도움 장소`
                : '지역 기준 장소 정보 없음'}
          </span>
        </div>
        {places.map((place, index) => {
          const category = mapCategory(place)
          const Icon = category.icon
          const position = markerPosition(place, index)
          const active = currentPlace?.id === place.id
          const displayPosition = getAdjustedMarkerPosition(position, active, hasSelectedCard)
          const obscured = isObscuredBySelectedCard(position, active, hasSelectedCard)
          const friendly = place.foreignerFriendly || category.id === 'hospital' || category.id === 'counseling'
          return (
            <button
              aria-label={`${place.name} 선택`}
              className={`life-map-marker ${category.markerClass} ${friendly ? 'friendly' : ''} ${obscured ? 'obscured' : ''} ${active ? 'active' : ''}`}
              key={place.id}
              onClick={() => onSelect(place)}
              style={{ left: `${displayPosition.x}%`, top: `${displayPosition.y}%` }}
              type="button"
            >
              <Icon size={18} />
              {friendly ? <b className="life-map-marker-badge" aria-label="외국인 친화 장소">지원</b> : null}
              <span>{place.name}</span>
            </button>
          )
        })}
      </div>
    </StaticMapView>
  )
}
