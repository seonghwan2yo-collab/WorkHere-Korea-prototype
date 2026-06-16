export type HomeBanner = {
  id: string
  title: string
  subtitle?: string
  imageUrl: string
  href: string
  category: 'jobs' | 'map' | 'community'
  alt: string
}

export const homeBanners: HomeBanner[] = [
  {
    id: 'job-01',
    title: '일자리 추천',
    subtitle: '내 지역과 관심정보에 맞는 일자리 정보를 확인하세요.',
    imageUrl: '/images/home/banners/home-banner-job-01.png',
    href: '/jobs',
    category: 'jobs',
    alt: 'WorkHere Korea 일자리 추천 배너',
  },
  {
    id: 'job-02',
    title: '비자 기준 일자리',
    subtitle: '비자 유형에 맞는 일자리 정보를 우선 확인하세요.',
    imageUrl: '/images/home/banners/home-banner-job-02.png',
    href: '/jobs?filter=visa',
    category: 'jobs',
    alt: '비자 기준 일자리 추천 배너',
  },
  {
    id: 'map-01',
    title: '생활지도',
    subtitle: '병원, 약국, 송금, 상담기관을 지역별로 찾아보세요.',
    imageUrl: '/images/home/banners/home-banner-map-01.png',
    href: '/map',
    category: 'map',
    alt: '생활지도 배너',
  },
  {
    id: 'map-02',
    title: '주변 병원·상담소',
    subtitle: '아플 때, 상담이 필요할 때 가까운 도움 장소를 확인하세요.',
    imageUrl: '/images/home/banners/home-banner-map-02.png',
    href: '/map?category=hospital',
    category: 'map',
    alt: '주변 병원과 상담소 안내 배너',
  },
  {
    id: 'community-01',
    title: '커뮤니티 안전방',
    subtitle: '임금, 숙소, 사기 피해 경험을 안전하게 공유하세요.',
    imageUrl: '/images/home/banners/home-banner-community-01.png',
    href: '/community',
    category: 'community',
    alt: '커뮤니티 안전방 배너',
  },
  {
    id: 'jeonbuk-e9-e8-01',
    title: '전라북도 농업 일자리 모집',
    subtitle: '전북 농업현장에서 일하는 E-9, E-8 외국인 근로자 커뮤니티입니다.',
    imageUrl: '/images/home/banners/home-banner-jeonbuk-e9-e8.png',
    href: '/community?group=jeonbuk-e9-e8',
    category: 'community',
    alt: '전라북도 농업 일자리 E-9 E-8 외국인 근로자 모집 배너',
  },
]
