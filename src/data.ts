import type {
  AdminLog,
  AdminReport,
  Banner,
  CommunityBoard,
  CommunityComment,
  CommunityGroup,
  CommunityMembership,
  DailyCategory,
  DailyFeed,
  FeedComment,
  FeedImage,
  FeedLike,
  HelpCategory,
  HelpReport,
  Job,
  Notice,
  Place,
  PlaceReport,
  Post,
  SavedItem,
  SupportInstitution,
  User,
  UserProfileRecord,
  Workplace,
} from './types'
import sampleUsersData from './data/sampleUsers.json'
import communityGroupsData from './data/communityGroups.json'
import communityBoardsData from './data/communityBoards.json'
import communityMembershipsData from './data/communityMemberships.json'
import helpCategoriesData from './data/helpCategories.json'
import supportInstitutionsData from './data/supportInstitutions.json'

const regions = ['경기 안산', '경기 시흥', '충북 청주', '충북 음성', '경남 김해', '경남 창원', '충남 천안', '전남 광주']
const nationalities = ['Vietnam', 'China', 'Uzbekistan', 'Vietnam', 'China', 'Uzbekistan']
const authors = ['Mina', 'Ali', 'Sara', 'Tuan', 'Rafi', 'Nika', 'Linh', 'Somchai', 'Anil', 'Grace']
const categories: DailyCategory[] = ['회사생활', '한국생활', '음식', '쉬는날', '숙소생활', '질문', '자랑/축하', '조심하세요']
const placeCategories = ['상담', '병원', '생활', '한국어교육', '송금', '마트', '쉼터', '행정']
const helpTypes = ['임금 문제', '계약 문제', '주거 문제', '폭언/폭행', '사기', '여권/신분증 보관', '의료/사고', '통역 필요', '기타']
const sampleUsers = sampleUsersData
export const communityGroups = communityGroupsData as CommunityGroup[]
export const communityBoards = communityBoardsData as CommunityBoard[]
export const communityMemberships = communityMembershipsData as CommunityMembership[]
export const helpCategories = helpCategoriesData as HelpCategory[]
export const supportInstitutions = supportInstitutionsData as SupportInstitution[]

function sampleUserFields(index: number) {
  const user = sampleUsers[index % sampleUsers.length]
  const verified = user.verificationStatus === 'verified'
  return {
    authorId: Number(user.id),
    displayName: user.displayName,
    username: user.username,
    userId: `user-${user.id}`,
    avatarUrl: user.avatarUrl || undefined,
    countryCode: user.countryCode,
    countryName: user.countryName,
    flagIconUrl: user.flagIconUrl || undefined,
    flagEmoji: user.flagEmoji,
    isCountryVerified: user.isCountryVerified,
    isVerified: verified,
    verificationStatus: user.verificationStatus as 'verified' | 'unverified' | 'pending',
    preferredLanguage: user.preferredLanguage as User['preferredLanguage'],
    gradientColors: user.gradientColors,
  }
}

export const users: User[] = Array.from({ length: 12 }, (_, index) => ({
  id: index + 1,
  name: authors[index % authors.length],
  ...sampleUserFields(index),
  nationality: nationalities[index % nationalities.length],
  region: regions[index % regions.length],
  visa: ['E-9', 'H-2', 'F-6', 'F-2'][index % 4],
  status: index === 4 ? 'blocked' : index % 5 === 1 ? 'warned' : 'active',
  warnings: index === 4 ? 3 : index % 5 === 1 ? 1 : 0,
}))

export const userProfiles: UserProfileRecord[] = users.map((user, index) => ({
  userId: user.id,
  language: index % 3 === 0 ? 'vi' : index % 3 === 1 ? 'en' : 'ko',
  nationality: user.nationality,
  region: user.region,
  visa: user.visa,
  interests: [['일자리', '의료'], ['생활지도', '한국어'], ['노동상담', '커뮤니티']][index % 3],
}))

export const workplaces: Workplace[] = Array.from({ length: 20 }, (_, index) => ({
  id: index + 1,
  name: `${regions[index % regions.length].split(' ').at(-1)} 글로벌워크 ${index + 1}`,
  region: regions[index % regions.length],
  reviewScore: 3.5 + (index % 6) * 0.2,
  riskTags: index % 7 === 0 ? ['급여 확인 필요'] : index % 9 === 0 ? ['숙소비 공제 확인'] : [],
}))

const jobVisaProfiles = [
  {
    category: 'manufacturing',
    industryCode: 'manufacturing',
    employmentType: 'full-time',
    allowedVisaTypes: ['E-9', 'H-2', 'F-2', 'F-5', 'F-6'],
    restrictedVisaTypes: ['D-2', 'D-4'],
    cautionVisaTypes: ['F-4', 'E-7', 'E-7-4'],
    visaNote: '제조업 공고로 분류되어 E-9 허용 업종에 해당할 수 있습니다. F-4는 단순노무 해당 여부 확인이 필요합니다.',
    isVisaFriendly: true,
    requiresVisaCheck: true,
  },
  {
    category: 'manufacturing',
    industryCode: 'cold-storage',
    employmentType: 'full-time',
    allowedVisaTypes: ['E-9', 'H-2', 'F-2', 'F-5', 'F-6'],
    restrictedVisaTypes: ['D-2', 'D-4'],
    cautionVisaTypes: ['F-4'],
    visaNote: '물류·저온창고 업무는 세부 직무와 체류자격 조건 확인이 필요합니다.',
    isVisaFriendly: true,
    requiresVisaCheck: true,
  },
  {
    category: 'hotel-support',
    industryCode: 'hotel-support',
    employmentType: 'part-time',
    allowedVisaTypes: ['H-2', 'F-2', 'F-5', 'F-6'],
    restrictedVisaTypes: ['E-9'],
    cautionVisaTypes: ['D-2', 'D-4', 'F-4'],
    visaNote: '호텔 지원 업무는 직무 범위에 따라 비자 적합성 확인이 필요합니다.',
    isVisaFriendly: true,
    requiresVisaCheck: true,
  },
  {
    category: 'logistics',
    industryCode: 'simple-labor',
    employmentType: 'full-time',
    allowedVisaTypes: ['H-2', 'F-2', 'F-5', 'F-6'],
    restrictedVisaTypes: ['D-2', 'D-4'],
    cautionVisaTypes: ['E-9', 'F-4', 'E-7', 'E-7-4'],
    visaNote: '단순 분류 업무는 체류자격별 제한 여부 확인이 필요합니다.',
    isVisaFriendly: false,
    requiresVisaCheck: true,
  },
  {
    category: 'agriculture',
    industryCode: 'agriculture',
    employmentType: 'full-time',
    allowedVisaTypes: ['E-9', 'H-2', 'F-2', 'F-5', 'F-6'],
    restrictedVisaTypes: ['D-2', 'D-4'],
    cautionVisaTypes: ['F-4'],
    visaNote: '농업 공고로 분류되어 E-9 허용 업종에 해당할 수 있습니다.',
    isVisaFriendly: true,
    requiresVisaCheck: true,
  },
  {
    category: 'food-service',
    industryCode: 'food-service',
    employmentType: 'part-time',
    allowedVisaTypes: ['H-2', 'F-2', 'F-5', 'F-6'],
    restrictedVisaTypes: ['E-9'],
    cautionVisaTypes: ['D-2', 'D-4', 'F-4'],
    visaNote: '음식점·서비스 공고는 E-9 비자에 적합하지 않을 수 있습니다. 유학·연수 비자는 자격외활동 허가 확인이 필요합니다.',
    isVisaFriendly: false,
    requiresVisaCheck: true,
  },
  {
    category: 'technical',
    industryCode: 'manufacturing-skilled',
    employmentType: 'full-time',
    allowedVisaTypes: ['E-7', 'E-7-4', 'F-2', 'F-5', 'F-6'],
    restrictedVisaTypes: ['D-2', 'D-4'],
    cautionVisaTypes: ['E-9', 'F-4'],
    visaNote: '숙련기능 또는 기술 직무로 분류될 수 있어 직종코드와 자격요건 확인이 필요합니다.',
    isVisaFriendly: true,
    requiresVisaCheck: true,
  },
]

const jobRegionCodes: Record<string, { regionCode: string; cityCode?: string; districtCode?: string }> = {
  '경기 안산': { regionCode: 'GG', cityCode: 'GG-ANSAN' },
  '경기 시흥': { regionCode: 'GG', cityCode: 'GG-SIHEUNG' },
  '충북 청주': { regionCode: 'CB', cityCode: 'CB-CHEONGJU', districtCode: 'CB-CHEONGJU-CHEONGWON' },
  '충북 음성': { regionCode: 'CB', cityCode: 'CB-EUMSEONG' },
  '경남 김해': { regionCode: 'GN', cityCode: 'GN-GIMHAE' },
  '경남 창원': { regionCode: 'GN', cityCode: 'GN-CHANGWON' },
  '충남 천안': { regionCode: 'CN', cityCode: 'CN-CHEONAN' },
  '전남 광주': { regionCode: 'GJ' },
}

export const jobs: Job[] = Array.from({ length: 20 }, (_, index) => {
  const pending = index % 6 === 1
  const visaProfile = jobVisaProfiles[index % jobVisaProfiles.length]
  const region = regions[index % regions.length]
  const regionCodes = jobRegionCodes[region] || {}
  return {
    id: index + 1,
    title: ['자동차 부품 포장 정보', '식품 제조 라인 보조', '호텔 객실 정비', '물류센터 분류 보조', '농산물 선별 작업'][index % 5],
    company: workplaces[index].name,
    region,
    ...regionCodes,
    district: region.split(' ').at(-1),
    category: visaProfile.category,
    industryCode: visaProfile.industryCode,
    employmentType: visaProfile.employmentType,
    salary: index % 3 === 0 ? `시급 ${(10030 + (index % 8) * 320).toLocaleString()}원` : `월 ${230 + (index % 6) * 10}만원 내외`,
    visa: index % 2 === 0 ? ['E-9', 'H-2'] : ['H-2', 'F-6'],
    wage: 10030 + (index % 8) * 320,
    payLabel: index % 3 === 0 ? `시급 ${(10030 + (index % 8) * 320).toLocaleString()}원` : `월 ${230 + (index % 6) * 10}만원 내외`,
    tags: [['주간', '기숙사'], ['잔업가능', '식사제공'], ['파트타임', '도심'], ['통근버스', '초보가능']][index % 4],
    shift: ['08:30 - 17:30', '09:00 - 18:00', '10:00 - 16:00', '20:00 - 05:00'][index % 4],
    description: '근무 조건을 확인할 수 있는 정보 제공용 공고입니다. 직접 채용 알선이 아니며 계약 전 근로조건 확인이 필요합니다.',
    allowedVisaTypes: visaProfile.allowedVisaTypes,
    restrictedVisaTypes: visaProfile.restrictedVisaTypes,
    cautionVisaTypes: visaProfile.cautionVisaTypes,
    visaNote: visaProfile.visaNote,
    isVisaFriendly: visaProfile.isVisaFriendly,
    requiresVisaCheck: visaProfile.requiresVisaCheck,
    source: pending ? 'user' : 'operator',
    approvalStatus: pending ? 'pending' : 'approved',
    saved: index % 8 === 0,
    hidden: index % 13 === 0,
    deleted: false,
    complianceNote: pending ? '사용자 등록. 불법 알선 표현 검수 필요' : '직접 알선 표현 없음',
  }
})

const lifeMapCategories = ['병원', '약국', '상담기관', '송금/은행', '통신/유심', '음식점/마트', '행정기관', '안전/산재', '종교/커뮤니티']
const lifeMapServices = [
  ['야간진료', '외국인 접수 안내', '진료비 안내'],
  ['상비약', '처방전 조제', '복약 상담'],
  ['노동상담', '통역 연결', '기관 안내'],
  ['해외송금', '계좌개설 안내', 'ATM'],
  ['유심 개통', '요금제 상담', '휴대폰 수리'],
  ['할랄/현지 식품', '생활용품', '저렴한 식사'],
  ['출입국 업무', '행정 서류', '체류 상담'],
  ['산재 상담', '긴급 안내', '안전 교육'],
  ['모임', '예배/기도', '생활정보 교류'],
]

const rawPlaces: Place[] = Array.from({ length: 100 }, (_, index) => {
  const pending = index % 9 === 2
  return {
    id: index + 1,
    name: `${regions[index % regions.length].split(' ').at(-1)} ${placeCategories[index % placeCategories.length]} 장소 ${index + 1}`,
    category: placeCategories[index % placeCategories.length],
    region: regions[index % regions.length],
    address: `${regions[index % regions.length]} 중심가 ${index + 10}`,
    phone: `0${index % 7 + 2}-0000-${String(1000 + index).slice(-4)}`,
    hours: ['평일 09:00 - 18:00', '월-토 10:00 - 17:00', '예약 후 방문', '매일 11:00 - 21:00'][index % 4],
    languages: index % 3 === 0 ? ['ko', 'en', 'vi'] : index % 3 === 1 ? ['ko', 'en'] : ['ko', 'vi'],
    reviews: [`${placeCategories[index % placeCategories.length]} 이용 안내가 도움이 됐어요.`],
    lat: 37.1 + (index % 20) * 0.01,
    lng: 126.7 + (index % 25) * 0.01,
    source: pending ? 'user' : 'operator',
    approvalStatus: pending ? 'pending' : 'approved',
    saved: index % 17 === 0,
    reviewHistory: pending ? ['사용자 장소 제보 접수', '관리자 검토 대기'] : ['운영자 등록', '연락처 확인 완료'],
  }
})

export const places: Place[] = rawPlaces.map((place, index) => ({
  ...place,
  name: `${place.region.split(' ').at(-1)} ${lifeMapCategories[index % lifeMapCategories.length]} 도움처 ${index + 1}`,
  category: lifeMapCategories[index % lifeMapCategories.length],
  distanceKm: Number((0.4 + (index % 18) * 0.35).toFixed(1)),
  isOpen: index % 4 !== 2,
  services: lifeMapServices[index % lifeMapServices.length],
  foreignerFriendly: index % 5 !== 3,
  linkedFeedIds: index % 4 === 0 ? [index + 1] : [],
  linkedPostIds: index % 6 === 0 ? [index + 1] : [],
  reviews: [
    `${lifeMapCategories[index % lifeMapCategories.length]} 이용 안내가 도움이 됐어요.`,
    index % 5 === 0 ? '처음 방문해도 접수 방법을 천천히 알려줬어요.' : '전화로 운영시간을 확인하고 방문하는 것이 좋아요.',
  ],
}))

export const placeReports: PlaceReport[] = places
  .filter((place) => place.source === 'user')
  .slice(0, 12)
  .map((place, index) => ({
    id: index + 1,
    placeId: place.id,
    reporter: authors[index % authors.length],
    status: place.approvalStatus,
    memo: '사진, 전화번호, 운영시간 확인 후 지도 노출 여부 결정',
  }))

export const initialDailyFeeds: DailyFeed[] = Array.from({ length: 50 }, (_, index) => {
  const category = categories[index % categories.length]
  const firstFeedImage = '/mock/daily/e9-farm-workers-happy.png'
  const secondFeedImage = '/mock/daily/2026-06-04%20162831.png'
  const thirdFeedImage = '/mock/daily/10224171-f0fa-492b-a6ae-10a577d48179.png'
  const body =
    index % 11 === 1
      ? '회사생활 질문입니다. 잔업 시간이 급여명세서에 다르게 적힌 것 같아 임금 문제 상담이 필요합니다.'
      : index % 13 === 2
        ? '처음 보는 사람이 여권 보관을 요구해서 조심하세요. 도움 요청 기록을 남기는 것이 좋겠습니다.'
        : `${regions[index % regions.length]}에서 ${category} 경험을 공유합니다. 생활지도와 커뮤니티에 연결해두면 다음에 찾기 쉬워요.`
  return {
    id: index + 1,
    image: index === 0 ? firstFeedImage : index === 1 ? secondFeedImage : index === 2 ? thirdFeedImage : `https://picsum.photos/seed/workhere-daily-${index + 1}/900/620`,
    images: index === 0
      ? [{ id: 1, url: firstFeedImage, alt: 'E-9 farm workers smiling on the way to the field' }]
      : index === 1
        ? [{ id: 1, url: secondFeedImage, alt: 'Foreign workers gathering together at a labor rally' }]
        : index === 2
          ? [{ id: 1, url: thirdFeedImage, alt: 'A disappointing cafeteria meal served to foreign workers' }]
      : Array.from({ length: index % 7 === 0 ? 4 : index % 5 === 0 ? 3 : 1 }, (_, imageIndex) => ({
        id: imageIndex + 1,
        url: `https://picsum.photos/seed/workhere-daily-${index + 1}-${imageIndex + 1}/900/1125`,
        alt: `${authors[index % authors.length]} daily photo ${imageIndex + 1}`,
      })),
    author: index === 0 ? 'Tuan Nguyen' : index === 1 ? 'Aziz Karimov' : index === 2 ? 'Linh Pham' : authors[index % authors.length],
    ...sampleUserFields(index),
    ...(index === 0 ? {
      authorId: 2,
      displayName: 'Tuan Nguyen',
      username: 'tuan.farm.e9',
      avatarUrl: '/mock/avatars/processed/avatar-002.webp',
      countryCode: 'VN',
      countryName: '베트남',
      flagIconUrl: '/flags/vn.svg',
      flagEmoji: '🇻🇳',
      isCountryVerified: true,
      isVerified: true,
      verificationStatus: 'verified' as const,
      preferredLanguage: 'vi' as const,
      gradientColors: ['#DA251D', '#FFCD00'],
    } : {}),
    ...(index === 1 ? {
      authorId: 7,
      displayName: 'Aziz Karimov',
      username: 'aziz.e9.voice',
      avatarUrl: '/mock/avatars/processed/avatar-019.webp',
      countryCode: 'UZ',
      countryName: '우즈베키스탄',
      flagIconUrl: '/flags/uz.svg',
      flagEmoji: '🇺🇿',
      isCountryVerified: true,
      isVerified: true,
      verificationStatus: 'verified' as const,
      preferredLanguage: 'en' as const,
      gradientColors: ['#1EB5E5', '#009B5A'],
    } : {}),
    ...(index === 2 ? {
      authorId: 3,
      displayName: 'Linh Pham',
      username: 'linh.food',
      avatarUrl: '/mock/avatars/processed/avatar-007.webp',
      countryCode: 'VN',
      countryName: '베트남',
      flagIconUrl: '/flags/vn.svg',
      flagEmoji: '🇻🇳',
      isCountryVerified: false,
      isVerified: false,
      verificationStatus: 'unverified' as const,
      preferredLanguage: 'vi' as const,
      gradientColors: ['#94A3B8', '#CBD5E1'],
    } : {}),
    nationality: index === 0 ? 'Vietnam' : index === 1 ? 'Uzbekistan' : index === 2 ? 'Vietnam' : nationalities[index % nationalities.length],
    region: index === 0 ? '충북 음성' : index === 1 ? '서울 광화문' : index === 2 ? '경기 안산' : regions[index % regions.length],
    createdAt: index < 9 ? `오늘 ${9 + index}:20` : `${index % 6 + 1}일 전`,
    body: index === 0 ? '아침에 농장으로 가는 길, 트럭 뒤에서 다 같이 손 흔들고 웃었어요. 오늘은 고추밭 정리하는 날이라 땀이 많이 났지만 팀 분위기가 좋아서 힘이 납니다. E-9로 한국에서 일하는 하루하루가 쉽지만은 않지만, 이렇게 웃는 얼굴 하나면 밭도 조금 더 넓게, 마음도 조금 더 가볍게 느껴져요. 오늘도 안전하게 일하고 맛있는 점심 먹자!' : index === 1 ? '자~~ 드가자! 오늘은 외국인 노동자 친구들과 함께 목소리 내는 날. 서로 안전하게 챙기고, 끝나고 따뜻한 밥 먹자!' : index === 2 ? '이건 아니지 말입니다!! 오늘 급식 보고 다 같이 조용해졌어요. 바쁜 날일수록 밥이라도 든든해야 힘이 나는데, 다음에는 조금만 더 신경 써주면 좋겠습니다.' : body,
    translatedBody: index === 0 ? 'On the way to the farm this morning, everyone smiled and waved from the truck. Work is not always easy, but a cheerful team makes the day feel lighter. Stay safe and enjoy lunch!' : index === 1 ? 'Let’s go! Today we stand together with foreign worker friends. Take care of each other, and let’s eat a warm meal after the rally.' : index === 2 ? 'This is really not okay! Everyone got quiet after seeing today’s cafeteria meal. On busy workdays, a proper meal matters. I hope it gets better next time.' : `Shared daily life information in ${regions[index % regions.length]}.`,
    category: index === 1 ? '회사생활' : index === 2 ? '음식' : category,
    hashtags: index === 0 ? ['#E9', '#농장일', '#충북음성', '#베트남인증', '#출근길', '#웃는하루', '#안전제일'] : index === 1 ? ['#외국인노동자', '#집회현장', '#노동권', '#함께가자', '#자드가자', '#안전하게'] : index === 2 ? ['#급식', '#식사개선', '#회사생활', '#기숙사생활', '#오늘밥', '#이건아니지말입니다'] : [`#${regions[index % regions.length].split(' ').at(-1)}`, `#${category}`, index % 5 === 0 ? '#생활정보' : '#기록'],
    placeId: index % 4 === 0 ? (index % places.length) + 1 : undefined,
    jobId: index === 1 ? 1 : category === '회사생활' ? (index % jobs.length) + 1 : undefined,
    likes: 6 + ((index * 7) % 90),
    comments: index === 1 ? ['응원합니다. 안전하게 다녀오세요.'] : index === 2 ? ['이건 진짜 개선이 필요해 보여요.'] : [`${regions[index % regions.length]} 정보 감사합니다.`],
    saved: index % 10 === 0,
    reported: index === 1 || index === 2 ? 0 : index % 11 === 1 || index % 13 === 2 ? 2 : index % 8 === 0 ? 1 : 0,
    visibility: index === 1 ? 'public' : index % 5 === 0 ? 'nationality' : index % 4 === 0 ? 'region' : 'public',
    hidden: index !== 0 && index % 29 === 0,
  }
})

export const feedImages: FeedImage[] = initialDailyFeeds.map((feed) => ({ id: feed.id, feedId: feed.id, url: feed.image }))

export const feedLikes: FeedLike[] = Array.from({ length: 140 }, (_, index) => ({
  id: index + 1,
  feedId: (index % initialDailyFeeds.length) + 1,
  userId: (index % users.length) + 1,
}))

export const feedComments: FeedComment[] = initialDailyFeeds.map((feed, index) => ({
  id: index + 1,
  feedId: feed.id,
  author: authors[(index + 2) % authors.length],
  authorId: Number(sampleUsers[(index + 2) % sampleUsers.length].id),
  body: feed.comments[0],
  reported: index % 12 === 0 ? 1 : 0,
}))

export const initialPosts: Post[] = Array.from({ length: 50 }, (_, index) => ({
  id: index + 1,
  groupId: communityGroups[index % communityGroups.length].id,
  boardId: ['free', 'qna', 'workplace', 'help', 'safety'][index % 5],
  title: ['근로계약서 확인 항목', '주말 한국어 수업 질문', '기숙사 생활 팁', '병원 통역 가능한 곳', '급여명세서 보는 법'][index % 5] + ` ${index + 1}`,
  author: authors[index % authors.length],
  ...sampleUserFields(index + 3),
  category: ['노동정보', '생활질문', '일자리후기', 'Q&A'][index % 4],
  body: '개인정보를 제외하고 경험을 공유합니다. 신고, 숨김, 삭제 검수가 가능한 커뮤니티 게시글 샘플입니다.',
  languageCode: ['ko', 'vi', 'en', 'zh', 'uz'][index % 5],
  originalLanguage: ['한국어', 'Tiếng Việt', 'English', '中文', "O'zbekcha"][index % 5],
  translatedText: '번역 미리보기: 개인정보를 제외하고 안전하게 경험을 공유합니다.',
  isNotice: index % 17 === 0,
  isAnonymous: index % 11 === 0,
  isSafetyReport: index % 9 === 0 || index % 5 === 4,
  likeCount: 4 + ((index * 3) % 48),
  commentCount: 1 + (index % 8),
  viewCount: 24 + index * 9,
  saved: index % 10 === 0,
  comments: [`댓글 샘플 ${index + 1}: 기관 안내와 실제 경험을 함께 확인해보세요.`],
  reported: index % 9 === 0 ? 2 : index % 7 === 0 ? 1 : 0,
  images: index % 6 === 0 ? [`community-${index + 1}.jpg`] : [],
  hidden: index % 31 === 0,
}))

export const communityComments: CommunityComment[] = Array.from({ length: 50 }, (_, index) => ({
  id: index + 1,
  postId: (index % initialPosts.length) + 1,
  author: authors[(index + 3) % authors.length],
  authorId: Number(sampleUsers[(index + 3) % sampleUsers.length].id),
  body: `댓글 샘플 ${index + 51}: 정확한 기관 안내를 확인하세요.`,
  reported: index % 10 === 0 ? 1 : 0,
}))

export const initialReports: HelpReport[] = Array.from({ length: 10 }, (_, index) => ({
  id: `H-${1024 + index}`,
  type: helpTypes[index % helpTypes.length],
  status: ['received', 'reviewing', 'agencyGuided', 'userAnswered', 'closed'][index % 5] as HelpReport['status'],
  content: '긴급 신고 대체가 아니라 관련 기관 안내와 상담 기록 관리를 위한 샘플입니다.',
  attachment: index % 3 === 0 ? `help-${index + 1}.jpg` : undefined,
}))

export const initialAdminReports: AdminReport[] = Array.from({ length: 24 }, (_, index) => {
  const targetTypes: AdminReport['targetType'][] = ['daily', 'post', 'comment', 'job', 'place']
  return {
    id: `RP-${201 + index}`,
    targetType: targetTypes[index % targetTypes.length],
    targetId: String((index % 20) + 1),
    reason: ['개인정보 노출 가능성', '얼굴 사진 검수 필요', '사업장 내부 사진 의심', '불법 알선 표현 의심', '혐오 표현 신고'][index % 5],
    status: ['received', 'reviewing', 'actioned', 'rejected', 'closed'][index % 5] as AdminReport['status'],
    reporter: index % 4 === 0 ? 'system' : authors[index % authors.length],
    createdAt: index < 8 ? `오늘 ${10 + index}:05` : `${index % 5 + 1}일 전`,
  }
})

export const initialAdminLogs: AdminLog[] = Array.from({ length: 12 }, (_, index) => ({
  id: index + 1,
  admin: '운영자',
  action: ['장소 검수', '피드 숨김', '신고 상태 변경', '회원 경고'][index % 4],
  target: ['장소 제보', '일상 피드', '신고 RP', '작성자'][index % 4],
  detail: 'admin_logs에 저장되는 관리자 처리 이력 샘플',
  createdAt: index < 3 ? `오늘 ${14 + index}:00` : `${index}일 전`,
}))

export const notices: string[] = [
  '불법 수수료 요구 주의',
  '산재 발생 시 가까운 지원센터 상담 가능',
  '장소와 일자리 제보는 관리자 승인 후 노출됩니다',
  '개인정보와 얼굴 사진이 포함된 게시물은 숨김 처리될 수 있습니다',
  '도움 요청은 기관 안내와 기록 관리 중심으로 운영됩니다',
]

export const noticeRecords: Notice[] = notices.map((title, index) => ({
  id: index + 1,
  title,
  body: `${title} 관련 다국어 공지 샘플입니다.`,
  published: index !== 4,
}))

export const banners: Banner[] = Array.from({ length: 5 }, (_, index) => ({
  id: index + 1,
  title: ['오늘의 한국생활', '급여명세서 확인 주간', '내 주변 상담센터', '안전한 숙소 생활', '커뮤니티 질문 모음'][index],
  body: ['생활 팁과 장소 정보를 함께 확인하세요.', '시급, 근무시간, 공제 항목을 기록하세요.', '언어 지원 장소를 지도로 찾을 수 있습니다.', '정확한 주소 대신 시/군/구 단위로 공유하세요.', '질문은 커뮤니티 Q&A로 이어집니다.'][index],
  image: `https://picsum.photos/seed/workhere-banner-${index + 1}/900/360`,
  published: index !== 3,
}))

export const savedItems: SavedItem[] = Array.from({ length: 36 }, (_, index) => ({
  id: index + 1,
  userId: (index % users.length) + 1,
  targetType: ['daily', 'post', 'job', 'place'][index % 4] as SavedItem['targetType'],
  targetId: (index % 30) + 1,
}))
