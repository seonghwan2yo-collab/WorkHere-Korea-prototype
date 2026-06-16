import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { HomeBanner } from '../../data/homeBanners'
import { assetUrl } from '../../utils/assetUrl'

type HomeBannerCarouselProps = {
  banners: HomeBanner[]
  onOpen: (banner: HomeBanner) => void
}

const AUTO_ROLLING_MS = 4000

export function HomeBannerCarousel({ banners, onOpen }: HomeBannerCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [failedImages, setFailedImages] = useState<Set<string>>(() => new Set())
  const [touchStartX, setTouchStartX] = useState<number | null>(null)
  const swipeLockRef = useRef(false)
  const safeBanners = banners.length ? banners : []
  const activeBanner = safeBanners[activeIndex]

  useEffect(() => {
    if (safeBanners.length <= 1) return
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % safeBanners.length)
    }, AUTO_ROLLING_MS)
    return () => window.clearInterval(timer)
  }, [activeIndex, safeBanners.length])

  if (!activeBanner) return null

  const goTo = (nextIndex: number) => {
    setActiveIndex((nextIndex + safeBanners.length) % safeBanners.length)
  }

  const move = (direction: 1 | -1) => {
    goTo(activeIndex + direction)
  }

  const handleTouchEnd = (clientX: number) => {
    if (touchStartX === null) return
    const delta = clientX - touchStartX
    setTouchStartX(null)
    if (Math.abs(delta) < 36) return
    swipeLockRef.current = true
    move(delta < 0 ? 1 : -1)
    window.setTimeout(() => {
      swipeLockRef.current = false
    }, 180)
  }

  const markImageFailed = (id: string) => {
    setFailedImages((current) => {
      const next = new Set(current)
      next.add(id)
      return next
    })
  }

  return (
    <section className="home-banner-carousel" aria-roledescription="carousel" aria-label="홈 추천 배너">
      <button
        className={`home-banner-slide category-${activeBanner.category}`}
        onClick={() => {
          if (swipeLockRef.current) return
          onOpen(activeBanner)
        }}
        onMouseDown={(event) => setTouchStartX(event.clientX)}
        onMouseUp={(event) => handleTouchEnd(event.clientX)}
        onTouchStart={(event) => setTouchStartX(event.touches[0]?.clientX ?? null)}
        onTouchEnd={(event) => handleTouchEnd(event.changedTouches[0]?.clientX ?? 0)}
        type="button"
        aria-label={`${activeBanner.title} 이동`}
      >
        <span className="home-banner-fallback" aria-hidden={!failedImages.has(activeBanner.id)}>
          {failedImages.has(activeBanner.id) ? (
            <span className="home-banner-placeholder-copy">
              <strong>{activeBanner.title}</strong>
              {activeBanner.subtitle ? <small>{activeBanner.subtitle}</small> : null}
            </span>
          ) : null}
        </span>
        {!failedImages.has(activeBanner.id) ? (
          <img
            src={assetUrl(activeBanner.imageUrl)}
            alt={activeBanner.alt}
            loading={activeIndex === 0 ? 'eager' : 'lazy'}
            decoding="async"
            onError={() => markImageFailed(activeBanner.id)}
          />
        ) : null}
      </button>

      {safeBanners.length > 1 ? (
        <>
          <button className="home-banner-nav prev" onClick={() => move(-1)} type="button" aria-label="이전 배너">
            <ChevronLeft size={18} />
          </button>
          <button className="home-banner-nav next" onClick={() => move(1)} type="button" aria-label="다음 배너">
            <ChevronRight size={18} />
          </button>
          <div className="home-banner-indicator" aria-label={`${activeIndex + 1}/${safeBanners.length}`}>
            <span className="home-banner-count">{activeIndex + 1}/{safeBanners.length}</span>
            <div className="home-banner-dots" aria-hidden="true">
              {safeBanners.map((banner, index) => (
                <button
                  className={index === activeIndex ? 'active' : ''}
                  key={banner.id}
                  onClick={() => goTo(index)}
                  type="button"
                  aria-label={`${index + 1}번째 배너 보기`}
                />
              ))}
            </div>
          </div>
        </>
      ) : null}
    </section>
  )
}
