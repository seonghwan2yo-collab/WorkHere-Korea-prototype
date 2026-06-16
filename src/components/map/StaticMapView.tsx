import { useRef, useState, type PointerEvent, type ReactNode } from 'react'
import { assetUrl } from '../../utils/assetUrl'

type StaticMapViewProps = {
  imageUrl: string
  alt: string
  caption?: string
  label?: string
  showOverlayLabel?: boolean
  pannable?: boolean
  children?: ReactNode
}

type Point = {
  x: number
  y: number
}

const PANNABLE_MAP_SCALE = 1.82
const PANNABLE_MAP_LIMIT = {
  x: 260,
  y: 170,
}

export function StaticMapView({
  imageUrl,
  alt,
  caption = '현재는 샘플 지도 이미지입니다.',
  label = '샘플 지도',
  showOverlayLabel = true,
  pannable = false,
  children,
}: StaticMapViewProps) {
  const [failed, setFailed] = useState(false)
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const dragStartRef = useRef<{ pointerId: number; start: Point; origin: Point } | null>(null)

  const clampOffset = (next: Point) => ({
    x: Math.max(-PANNABLE_MAP_LIMIT.x, Math.min(PANNABLE_MAP_LIMIT.x, next.x)),
    y: Math.max(-PANNABLE_MAP_LIMIT.y, Math.min(PANNABLE_MAP_LIMIT.y, next.y)),
  })

  const startPan = (event: PointerEvent<HTMLDivElement>) => {
    if (!pannable || failed) return
    const target = event.target as HTMLElement
    if (target.closest('button, a, input, select, textarea')) return
    dragStartRef.current = {
      pointerId: event.pointerId,
      start: { x: event.clientX, y: event.clientY },
      origin: offset,
    }
    setDragging(true)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const movePan = (event: PointerEvent<HTMLDivElement>) => {
    const dragStart = dragStartRef.current
    if (!pannable || !dragStart || dragStart.pointerId !== event.pointerId) return
    setOffset(clampOffset({
      x: dragStart.origin.x + event.clientX - dragStart.start.x,
      y: dragStart.origin.y + event.clientY - dragStart.start.y,
    }))
  }

  const endPan = (event: PointerEvent<HTMLDivElement>) => {
    if (dragStartRef.current?.pointerId === event.pointerId) {
      dragStartRef.current = null
      setDragging(false)
    }
  }

  return (
    <figure className="static-map-view">
      <div
        className={`static-map-image-wrap ${pannable ? 'pannable' : ''} ${dragging ? 'dragging' : ''}`}
        onPointerDown={startPan}
        onPointerMove={movePan}
        onPointerUp={endPan}
        onPointerCancel={endPan}
      >
        {failed ? (
          <div className="static-map-fallback" role="img" aria-label="지도 이미지 로딩 실패">
            <strong>지도를 불러오지 못했습니다.</strong>
            <span>샘플 지도 이미지를 다시 확인해주세요.</span>
          </div>
        ) : (
          <img
            src={assetUrl(imageUrl)}
            alt={alt}
            draggable={false}
            loading="lazy"
            onError={() => setFailed(true)}
            style={pannable ? { transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${PANNABLE_MAP_SCALE})` } : undefined}
          />
        )}
        {showOverlayLabel ? <span className="static-map-label">{label}</span> : null}
        {children}
      </div>
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  )
}
