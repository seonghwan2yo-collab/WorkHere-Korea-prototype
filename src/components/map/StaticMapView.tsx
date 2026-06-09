import { useState, type ReactNode } from 'react'

type StaticMapViewProps = {
  imageUrl: string
  alt: string
  caption?: string
  label?: string
  showOverlayLabel?: boolean
  children?: ReactNode
}

export function StaticMapView({
  imageUrl,
  alt,
  caption = '현재는 샘플 지도 이미지입니다.',
  label = '샘플 지도',
  showOverlayLabel = true,
  children,
}: StaticMapViewProps) {
  const [failed, setFailed] = useState(false)

  return (
    <figure className="static-map-view">
      <div className="static-map-image-wrap">
        {failed ? (
          <div className="static-map-fallback" role="img" aria-label="지도 이미지 로딩 실패">
            <strong>지도를 불러오지 못했습니다.</strong>
            <span>샘플 지도 이미지를 다시 확인해주세요.</span>
          </div>
        ) : (
          <img src={imageUrl} alt={alt} loading="lazy" onError={() => setFailed(true)} />
        )}
        {showOverlayLabel ? <span className="static-map-label">{label}</span> : null}
        {children}
      </div>
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  )
}
