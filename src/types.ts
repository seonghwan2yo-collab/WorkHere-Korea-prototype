import type { LucideIcon } from 'lucide-react'

export type Language = 'ko' | 'en' | 'vi'

export type Screen =
  | 'splash'
  | 'language'
  | 'login'
  | 'onboarding'
  | 'home'
  | 'daily'
  | 'dailyCreate'
  | 'jobs'
  | 'jobDetail'
  | 'salary'
  | 'places'
  | 'placeDetail'
  | 'community'
  | 'communityGroups'
  | 'communityGroupDetail'
  | 'postDetail'
  | 'postCreate'
  | 'help'
  | 'notifications'
  | 'mypage'
  | 'admin'
  | 'adminUsers'
  | 'adminFeeds'
  | 'adminPosts'
  | 'adminComments'
  | 'adminJobs'
  | 'adminPlaces'
  | 'adminReports'
  | 'adminHelp'
  | 'adminNotices'
  | 'adminBanners'
  | 'adminGroups'
  | 'adminGroupMembers'
  | 'adminQA'
  | 'adminBugs'

export type ApprovalStatus = 'approved' | 'pending' | 'rejected'
export type ReportStatus = 'received' | 'reviewing' | 'actioned' | 'rejected' | 'closed'
export type HelpStatus = 'received' | 'reviewing' | 'agencyGuided' | 'userAnswered' | 'closed'
export type CommunityJoinMode = 'open' | 'approval' | 'conditional'
export type CommunityMemberRole = 'owner' | 'staff' | 'member' | 'guest'
export type CommunityMembershipStatus = 'joined' | 'pending' | 'blocked'

export type UserProfile = {
  nationality: string
  region: string
  visa: string
  interests: string[]
}

export type UserProfileRecord = UserProfile & {
  userId: number
  language: Language
}

export type User = {
  id: number
  name: string
  avatarUrl?: string
  displayName?: string
  username?: string
  userId?: string
  authorId?: number
  countryCode?: string
  countryName?: string
  flagIconUrl?: string
  flagEmoji?: string
  isCountryVerified?: boolean
  isVerified?: boolean
  verificationStatus?: 'verified' | 'unverified' | 'pending'
  preferredLanguage?: Language
  gradientColors?: string[]
  nationality: string
  region: string
  visa: string
  status: 'active' | 'warned' | 'blocked' | 'limited'
  warnings: number
}

export type Job = {
  id: number
  title: string
  company: string
  region: string
  regionCode?: string
  cityCode?: string
  districtCode?: string
  district?: string
  category?: string
  industryCode?: string
  employmentType?: string
  salary?: string
  visa: string[]
  wage: number
  payLabel: string
  tags: string[]
  shift: string
  description: string
  allowedVisaTypes?: string[]
  restrictedVisaTypes?: string[]
  cautionVisaTypes?: string[]
  visaNote?: string
  isVisaFriendly?: boolean
  requiresVisaCheck?: boolean
  source: 'operator' | 'user'
  approvalStatus: ApprovalStatus
  saved?: boolean
  hidden?: boolean
  deleted?: boolean
  complianceNote?: string
}

export type Place = {
  id: number
  name: string
  category: string
  region: string
  address: string
  phone: string
  hours: string
  languages: Language[]
  distanceKm?: number
  isOpen?: boolean
  services?: string[]
  foreignerFriendly?: boolean
  linkedFeedIds?: number[]
  linkedPostIds?: number[]
  reviews: string[]
  lat: number
  lng: number
  source: 'operator' | 'user'
  approvalStatus: ApprovalStatus
  saved?: boolean
  reviewHistory?: string[]
}

export type Post = {
  id: number
  groupId?: string
  boardId?: string
  title: string
  author: string
  authorId?: number
  avatarUrl?: string
  displayName?: string
  username?: string
  countryCode?: string
  countryName?: string
  flagIconUrl?: string
  flagEmoji?: string
  isCountryVerified?: boolean
  isVerified?: boolean
  verificationStatus?: 'verified' | 'unverified' | 'pending'
  preferredLanguage?: Language
  gradientColors?: string[]
  category: string
  body: string
  content?: string
  languageCode?: string
  originalLanguage?: string
  translatedText?: string
  isNotice?: boolean
  isAnonymous?: boolean
  isSafetyReport?: boolean
  likeCount?: number
  commentCount?: number
  viewCount?: number
  saved?: boolean
  comments: string[]
  reported: number
  images: string[]
  hidden?: boolean
  deleted?: boolean
}

export type CommunityGroup = {
  id: string
  name: string
  description: string
  groupImageUrl?: string
  backgroundImageUrl?: string
  heroVariant?: 'image' | 'safety' | 'default'
  regionCode: string
  regionName: string
  countryCode: string
  countryName: string
  languageCode: string
  languageName: string
  visaTypes: string[]
  joinMode: CommunityJoinMode
  requiredConditions: string[]
  requiresCountryVerification: boolean
  memberCount: number
  postCount: number
  isOfficialSeedGroup: boolean
  isSafetyFocused: boolean
  hidden?: boolean
  reviewStatus?: ApprovalStatus
  moderationMemo?: string
  createdBy: string
  createdAt: string
}

export type CommunityBoard = {
  id: string
  groupId: string
  name: string
  type: 'free' | 'qna' | 'workplace' | 'market' | 'help' | 'safety'
  description: string
  writePermission: 'member' | 'staff' | 'verified'
  sortOrder: number
}

export type CommunityMembership = {
  groupId: string
  userId: number
  role: CommunityMemberRole
  status: CommunityMembershipStatus
  joinedAt: string
}

export type HelpCategory = {
  id: string
  title: string
  shortTitle: string
  description: string
  icon: string
  issueTypes: string[]
  applies: string[]
  firstCheck: string[]
  prepare: string[]
  relatedArticles: string[]
  communityTag: string
  mapCategory: string
}

export type SupportInstitution = {
  id: string
  name: string
  type: string
  issueTypes: string[]
  phone: string
  availableLanguages: string[]
  regionCode: string
  regionName: string
  address: string
  lat: number
  lng: number
  openingHours: string
  reservationAvailable: boolean
  reservationUrl?: string
  officialUrl?: string
  sourceName: string
  sourceUrl?: string
  lastUpdated: string
  cautionText: string
}

export type DailyCategory =
  | '회사생활'
  | '한국생활'
  | '음식'
  | '쉬는날'
  | '숙소생활'
  | '질문'
  | '자랑/축하'
  | '조심하세요'

export type DailyVisibility = 'public' | 'nationality' | 'region'

export type DailyFeed = {
  id: number
  image: string
  images: Array<{ id: number; url: string; alt?: string }>
  author: string
  authorId?: number
  avatarUrl?: string
  displayName?: string
  username?: string
  countryCode?: string
  countryName?: string
  flagIconUrl?: string
  flagEmoji?: string
  isCountryVerified?: boolean
  isVerified?: boolean
  verificationStatus?: 'verified' | 'unverified' | 'pending'
  preferredLanguage?: Language
  gradientColors?: string[]
  nationality: string
  region: string
  createdAt: string
  body: string
  translatedBody: string
  category: DailyCategory
  hashtags: string[]
  placeId?: number
  jobId?: number
  likes: number
  comments: string[]
  saved?: boolean
  reported: number
  visibility: DailyVisibility
  hidden?: boolean
  deleted?: boolean
}

export type FeedImage = {
  id: number
  feedId: number
  url: string
}

export type FeedLike = {
  id: number
  feedId: number
  userId: number
}

export type FeedComment = {
  id: number
  feedId: number
  author: string
  authorId?: number
  body: string
  reported: number
  hidden?: boolean
  deleted?: boolean
}

export type CommunityComment = {
  id: number
  postId: number
  author: string
  authorId?: number
  body: string
  reported: number
  hidden?: boolean
  deleted?: boolean
}

export type Workplace = {
  id: number
  name: string
  region: string
  reviewScore: number
  riskTags: string[]
}

export type PlaceReport = {
  id: number
  placeId: number
  reporter: string
  status: ApprovalStatus
  memo: string
}

export type HelpReport = {
  id: string
  type: string
  status: HelpStatus
  content: string
  attachment?: string
}

export type AdminReport = {
  id: string
  targetType: 'daily' | 'post' | 'comment' | 'job' | 'place' | 'user' | 'group'
  targetId: string
  reason: string
  status: ReportStatus
  reporter: string
  createdAt: string
}

export type AdminLog = {
  id: number
  admin: string
  action: string
  target: string
  detail: string
  createdAt: string
}

export type Notice = {
  id: number
  title: string
  body: string
  published: boolean
}

export type Banner = {
  id: number
  title: string
  body: string
  image: string
  published: boolean
}

export type SavedItem = {
  id: number
  userId: number
  targetType: 'daily' | 'post' | 'job' | 'place'
  targetId: number
}

export type AnalyticsEventName =
  | 'sign_up_completed'
  | 'onboarding_completed'
  | 'language_selected'
  | 'feed_viewed'
  | 'feed_created'
  | 'feed_liked'
  | 'feed_commented'
  | 'feed_saved'
  | 'post_created'
  | 'post_commented'
  | 'place_viewed'
  | 'place_saved'
  | 'place_reported'
  | 'job_viewed'
  | 'job_saved'
  | 'salary_calculated'
  | 'help_report_submitted'
  | 'report_submitted'
  | 'search_performed'
  | 'profile_updated'

export type AnalyticsEvent = {
  id: number
  name: AnalyticsEventName
  screen: string
  detail: string
  createdAt: string
}

export type QaScenario = {
  id: number
  title: string
  path: string
  expected: string
  status: 'ready' | 'pass' | 'needsCheck'
}

export type BetaAccount = {
  role: string
  email: string
  password: string
  language: Language | 'guest'
  profile: string
  interests: string
  memo: string
}

export type BugReport = {
  id: number
  screenName: string
  issueType: string
  path: string
  description: string
  severity: '낮음' | '보통' | '높음' | '긴급'
  status: '접수' | '확인 중' | '수정 완료' | '보류'
  ownerMemo: string
  createdAt: string
  updatedAt: string
}

export type NavItem = {
  screen: Screen
  label: string
  icon: LucideIcon
}
