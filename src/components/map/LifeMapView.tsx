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
import type { Place } from '../../types'
import { StaticMapView } from './StaticMapView'

type LifeMapViewProps = {
  places: Place[]
  activePlace?: Place
  region: string
  onSelect: (place: Place) => void
  onLocate: () => void
  onSave: (place: Place) => void
}

type MapCategoryId = 'hospital' | 'pharmacy' | 'counseling' | 'remittance' | 'admin' | 'food' | 'community'

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
  { id: 'community', label: '커뮤니티', markerClass: 'community', icon: MessageCircle },
]

const categoryAnchors: Record<MapCategoryId, [number, number]> = {
  hospital: [57, 48],
  pharmacy: [63, 55],
  counseling: [48, 42],
  remittance: [54, 66],
  admin: [69, 43],
  food: [44, 62],
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
  return mapCategories[6]
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

function languageLabel(languages: Place['languages']) {
  const labels: Record<string, string> = { ko: '한국어', en: 'English', vi: 'Tiếng Việt' }
  return languages.map((language) => labels[language] || language).join(', ')
}

function categorySummary(places: Place[]) {
  return mapCategories
    .map((category) => ({
      ...category,
      count: places.filter((place) => mapCategory(place).id === category.id).length,
    }))
    .filter((category) => category.count > 0)
}

export function LifeMapView({ places, activePlace, region, onSelect, onLocate, onSave }: LifeMapViewProps) {
  const currentPlace = activePlace && places.some((place) => place.id === activePlace.id) ? activePlace : undefined
  const hasSelectedCard = Boolean(currentPlace)
  const summaryLabel = places.length > 0
    ? `주변 장소 ${places.length}개`
    : '조건에 맞는 장소가 없습니다'

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
        <div className="life-map-region-chip"><MapPin size={14} />{region} · 오창읍 주변</div>
        <button className="life-map-locate-chip" type="button" onClick={onLocate}><Route size={14} />현재 위치</button>
        <div className="life-map-legend" aria-label="현재 필터 결과">
          {categorySummary(places).map((category) => (
            <span className={`life-map-legend-chip ${category.markerClass}`} key={category.id}>{category.label} {category.count}곳</span>
          ))}
        </div>
        {!hasSelectedCard ? (
          <div className={`life-map-summary-bar ${places.length === 0 ? 'empty' : ''}`} aria-live="polite">
            <strong>{summaryLabel}</strong>
            <span>{places.length > 0 ? '마커를 선택해 상세를 확인하세요' : '지역 또는 유형 필터를 바꾸거나 장소를 제보해 주세요'}</span>
          </div>
        ) : null}
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
              {friendly ? <b className="life-map-marker-badge" aria-label="외국인 친화 장소">외</b> : null}
              <span>{place.name}</span>
            </button>
          )
        })}
        {currentPlace ? (
          <>
          <div className="life-map-safe-bottom-fade" aria-hidden="true" />
          <article className="selected-map-place-card">
            <div>
              <div className="selected-map-place-badges">
                <span className={`category-badge ${mapCategory(currentPlace).markerClass}`}>{currentPlace.category}</span>
                {currentPlace.foreignerFriendly ? <span className="status-badge success">외국인 친화</span> : null}
              </div>
              <strong>{currentPlace.name}</strong>
              <p>{currentPlace.region} · {currentPlace.distanceKm?.toFixed(1) || '-'}km · {languageLabel(currentPlace.languages)}</p>
            </div>
            <div className="selected-map-place-actions">
              <a href={`tel:${currentPlace.phone}`}>전화</a>
              <button type="button">길찾기</button>
              <button type="button" onClick={() => onSave(currentPlace)}>{currentPlace.saved ? '저장됨' : '저장'}</button>
            </div>
          </article>
          </>
        ) : null}
      </div>
    </StaticMapView>
  )
}
