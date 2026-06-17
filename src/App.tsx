import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import {
  AlertTriangle,
  Bell,
  Bookmark,
  BriefcaseBusiness,
  Building,
  Calculator,
  Camera,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Cross,
  Eye,
  Flag,
  Globe2,
  Heart,
  HeartHandshake,
  HeartPulse,
  Home,
  ImagePlus,
  Landmark,
  Languages,
  LayoutDashboard,
  LockKeyhole,
  Map,
  MapPin,
  MessageCircle,
  Moon,
  MoreHorizontal,
  Pill,
  PhoneCall,
  Plus,
  ReceiptText,
  Search,
  Send,
  Share2,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Sun,
  Trash2,
  UserRound,
  UserX,
  UsersRound,
} from 'lucide-react'
import workhereLogo from './assets/workhere-logo.png'
import {
  initialAdminLogs,
  initialAdminReports,
  communityBoards as seedCommunityBoards,
  communityGroups as seedCommunityGroups,
  communityMemberships as seedCommunityMemberships,
  helpCategories as seedHelpCategories,
  initialDailyFeeds,
  initialPosts,
  initialReports,
  banners as seedBanners,
  jobs as seedJobs,
  noticeRecords as seedNoticeRecords,
  places as seedPlaces,
  supportInstitutions as seedSupportInstitutions,
  users as seedUsers,
} from './data'
import { languages, translations } from './i18n'
import { evaluateCommunityJoinPolicy } from './communityAccessPolicy'
import { ProfileAvatar } from './components/profile/ProfileAvatar'
import { ProfileIdentity } from './components/profile/ProfileIdentity'
import { getSampleUserById, getSampleUserForName, mergeProfileUser, profileStatusLabel, type ProfileUser } from './components/profile/profileUtils'
import { LifeMapView } from './components/map/LifeMapView'
import { HomeBannerCarousel } from './components/home/HomeBannerCarousel'
import { homeBanners, type HomeBanner } from './data/homeBanners'
import { flattenJobRegions, jobRegions } from './data/regions'
import {
  getVisaFilterNotice,
  getVisaJobMatch,
  getVisaTypeLabel,
  visaTypeOptions,
  type VisaJobMatch,
  type VisaType,
} from './utils/visaJobRules'
import { assetUrl } from './utils/assetUrl'
import type {
  AdminLog,
  AdminReport,
  AnalyticsEvent,
  AnalyticsEventName,
  ApprovalStatus,
  BetaAccount,
  BugReport,
  DailyCategory,
  DailyFeed,
  DailyVisibility,
  HelpCategory,
  HelpReport,
  HelpStatus,
  Job,
  Language,
  Banner,
  CommunityBoard,
  CommunityGroup,
  CommunityJoinMode,
  CommunityMemberRole,
  CommunityMembership,
  CommunityMembershipStatus,
  NavItem,
  Notice,
  Place,
  Post,
  QaScenario,
  ReportStatus,
  Screen,
  SupportInstitution,
  User,
  UserProfile,
} from './types'
import './App.css'

type AppIcon = (props: { size?: number; className?: string }) => ReactNode

const statusLabel = {
  approved: '승인됨',
  pending: '관리자 승인 대기',
  rejected: '반려',
} satisfies Record<ApprovalStatus, string>

const reportStatusLabel = {
  received: '접수',
  reviewing: '확인 중',
  actioned: '조치 완료',
  rejected: '반려',
  closed: '종료',
} satisfies Record<ReportStatus, string>

const helpStatusLabel = {
  received: '접수',
  reviewing: '확인 중',
  agencyGuided: '기관 안내 완료',
  userAnswered: '사용자 답변 완료',
  closed: '종료',
} satisfies Record<HelpStatus, string>

const communityJoinModeLabel = {
  open: '공개형',
  approval: '승인형',
  conditional: '조건형',
} satisfies Record<CommunityJoinMode, string>

type CommunityPostVariant = 'qa' | 'list' | 'album' | 'notice' | 'trade'
type CommunityIntentFilter = {
  id: string
  label: string
  description: string
  isPrimary: boolean
  cardType: CommunityPostVariant
}

const communityIntentFilters: CommunityIntentFilter[] = [
  { id: 'all', label: '전체', description: '모든 공개 피드를 봅니다.', isPrimary: true, cardType: 'list' },
  { id: 'question', label: '질문', description: '한국 생활과 회사생활 질문을 봅니다.', isPrimary: true, cardType: 'qa' },
  { id: 'life', label: '생활정보', description: '병원, 통신, 생활 팁 정보를 봅니다.', isPrimary: true, cardType: 'list' },
  { id: 'company-review', label: '회사후기', description: '회사와 기숙사 경험을 봅니다.', isPrimary: true, cardType: 'list' },
  { id: 'help', label: '도움요청', description: '임금, 사기, 차별 등 도움 글을 봅니다.', isPrimary: true, cardType: 'qa' },
  { id: 'daily', label: '일상', description: '사진과 짧은 생활 기록을 봅니다.', isPrimary: true, cardType: 'album' },
  { id: 'trade', label: '중고거래', description: '중고 물품 거래와 나눔 글을 봅니다.', isPrimary: false, cardType: 'trade' },
  { id: 'visa', label: '비자·체류', description: '비자, 체류, 외국인등록 정보를 봅니다.', isPrimary: false, cardType: 'list' },
  { id: 'wage', label: '임금·노동', description: '급여, 근로계약, 노동 상담 글을 봅니다.', isPrimary: false, cardType: 'list' },
  { id: 'medical', label: '병원·의료', description: '병원, 의료통역, 건강보험 글을 봅니다.', isPrimary: false, cardType: 'list' },
  { id: 'dorm', label: '기숙사', description: '숙소, 공제, 생활 규칙 글을 봅니다.', isPrimary: false, cardType: 'list' },
  { id: 'local', label: '지역소식', description: '지역 행사와 생활 소식을 봅니다.', isPrimary: false, cardType: 'list' },
  { id: 'meeting', label: '모임', description: '친구, 동호회, 커뮤니티 모임 글을 봅니다.', isPrimary: false, cardType: 'list' },
  { id: 'share', label: '나눔', description: '무료 나눔과 도움 요청 글을 봅니다.', isPrimary: false, cardType: 'trade' },
  { id: 'notice', label: '공지', description: '운영자 공지와 안전 안내를 봅니다.', isPrimary: false, cardType: 'notice' },
  { id: 'free', label: '자유글', description: '자유롭게 올린 공개 글을 봅니다.', isPrimary: false, cardType: 'list' },
]
const primaryJobVisaFilters: VisaType[] = ['ALL', 'E-9', 'E-10', 'H-2', 'F-4', 'F-2', 'F-5', 'F-6', 'D-2', 'D-4', 'E-7', 'E-7-4', 'KOREAN_NATIONALIZED', 'UNKNOWN']
const visaLegalNotice = '비자별 일자리 정보는 참고용입니다. 최종 취업 가능 여부는 사업장, 고용허가, 체류자격 조건 및 관계기관 확인이 필요합니다.'

const communityMembershipStatusLabel = {
  joined: '가입됨',
  pending: '승인 대기',
  blocked: '차단됨',
} satisfies Record<CommunityMembershipStatus, string>

type HelpCategoryView = Omit<HelpCategory, 'icon'> & { icon: typeof HeartHandshake }

const dailyCategories: DailyCategory[] = ['회사생활', '한국생활', '음식', '쉬는날', '숙소생활', '질문', '자랑/축하', '조심하세요']
const dangerWords = ['임금체불', '사기', '폭행', '여권 보관', '여권보관']
const lifeMapCategories = ['병원', '약국', '상담기관', '송금/은행', '통신/유심', '음식점/마트', '행정기관', '안전/산재', '종교/커뮤니티']
const defaultPlaceFilters = ['병원', '약국', '상담기관', '송금/은행', '행정기관']
const fallbackHelpTypes = [
  {
    id: 'wage',
    title: '임금체불',
    description: '월급을 받지 못했거나 일부만 받은 경우',
    icon: ReceiptText,
    guide: '급여명세서, 근무시간 기록, 계약서 사진을 보관하세요. 고용노동부 상담 또는 안전방에 경험을 남길 수 있습니다.',
    applies: ['월급을 받지 못함', '약속한 금액보다 적게 받음', '퇴사 후 정산이 안 됨'],
    firstCheck: ['급여 지급일과 실제 입금일', '근무시간과 잔업 기록', '계약서 또는 구두 약속 내용'],
    prepare: ['회사명', '근무기간', '급여 약속 내용', '입금 내역'],
    supportPlaces: ['고용노동부 상담', '외국인력상담센터', '노동상담기관'],
    mapCategory: '상담기관',
  },
  {
    id: 'fraud',
    title: '허위 일자리·사기 신고',
    description: '보증금, 소개비, 가짜 일자리 피해',
    icon: ShieldAlert,
    guide: '수수료 요구, 여권 보관, 허위 근로조건은 신고 대상입니다. 대화 기록과 계좌 정보를 캡처해두세요.',
    applies: ['보증금 요구', '소개비 과다 요구', '가짜 회사 정보', '여권/외국인등록증 보관 요구'],
    firstCheck: ['회사명과 실제 사업장 주소', '입금 요구 계좌와 대화 내용', '채용 조건이 계속 바뀌는지'],
    prepare: ['채팅 캡처', '입금 내역', '공고 링크', '상대방 연락처'],
    supportPlaces: ['고용노동부 상담', '경찰 상담', '커뮤니티 안전방'],
    mapCategory: '상담기관',
  },
  {
    id: 'contract',
    title: '부당해고·근로계약 문제',
    description: '계약서와 실제 조건이 다르거나 해고 통보를 받은 경우',
    icon: CheckCircle2,
    guide: '근로계약서, 출근 기록, 문자 내용을 정리하세요. 노동상담기관에서 계약 조건을 확인받을 수 있습니다.',
    applies: ['계약서와 실제 일이 다름', '갑작스러운 해고 통보', '근무시간이나 숙소비 조건 변경'],
    firstCheck: ['근로계약서 보관 여부', '해고 통보 방식', '비자와 사업장 변경 가능성'],
    prepare: ['근로계약서', '출근 기록', '문자/메신저 기록', '사업장 정보'],
    supportPlaces: ['노동상담기관', '고용센터', '외국인력상담센터'],
    mapCategory: '상담기관',
  },
  {
    id: 'injury',
    title: '산재·부상',
    description: '일하다 다쳤거나 치료가 필요한 경우',
    icon: Cross,
    guide: '다친 날짜와 장소, 작업 내용, 병원 기록을 보관하세요. 치료가 급하면 119 또는 가까운 병원부터 이용하세요.',
    applies: ['일하다 다침', '치료비 문제', '회사가 산재 처리를 안 해줌'],
    firstCheck: ['응급 치료가 필요한지', '다친 시간과 작업 내용', '회사에 알린 기록'],
    prepare: ['병원 진료 기록', '사고 당시 사진', '목격자 정보', '작업 지시 내용'],
    supportPlaces: ['병원', '산재 상담기관', '안전/산재 도움처'],
    mapCategory: '안전/산재',
  },
  {
    id: 'housing',
    title: '숙소 문제',
    description: '기숙사, 보증금, 시설, 퇴거 문제',
    icon: Home,
    guide: '숙소 사진, 계약 내용, 공제 내역을 기록하세요. 개인정보가 포함된 사진은 커뮤니티에 올리지 마세요.',
    applies: ['기숙사 환경 불량', '과도한 숙소비 공제', '퇴거 강요'],
    firstCheck: ['숙소비 공제 내역', '계약서 또는 안내문', '안전·위생 문제가 있는지'],
    prepare: ['숙소 사진', '공제 내역', '계약 내용', '관리자와의 대화 기록'],
    supportPlaces: ['노동상담기관', '외국인지원센터', '커뮤니티 안전방'],
    mapCategory: '상담기관',
  },
  {
    id: 'discrimination',
    title: '차별·폭언·성희롱',
    description: '차별, 폭언, 괴롭힘, 성희롱을 겪은 경우',
    icon: MessageCircle,
    guide: '상황 발생 시간, 장소, 증거를 안전하게 보관하세요. 신체 위험이 있으면 즉시 112에 신고하세요.',
    applies: ['국적 차별', '폭언', '신체 접촉', '불이익 협박'],
    firstCheck: ['지금 안전한 장소에 있는지', '반복적으로 발생했는지', '목격자가 있는지'],
    prepare: ['날짜와 장소 기록', '문자/녹취 등 증거', '목격자 정보', '피해 내용 메모'],
    supportPlaces: ['상담기관', '경찰 상담', '외국인지원센터'],
    mapCategory: '상담기관',
  },
  {
    id: 'visa',
    title: '비자·체류 문제',
    description: '체류기간, 사업장 변경, 외국인등록 문제',
    icon: Landmark,
    guide: '체류기간과 비자 종류를 확인하고, 출입국·외국인청 또는 상담기관 안내를 우선 확인하세요.',
    applies: ['체류기간 확인', '사업장 변경', '외국인등록', '출국/재입국'],
    firstCheck: ['현재 비자 종류', '체류기간 만료일', '사업장 변경 사유'],
    prepare: ['여권 정보', '외국인등록 정보', '고용계약 자료', '출입국 안내 문자'],
    supportPlaces: ['출입국·외국인청', '행정기관', '외국인지원센터'],
    mapCategory: '행정기관',
  },
  {
    id: 'emergency',
    title: '긴급 연락처',
    description: '생명·신체 위험 또는 즉시 구조가 필요한 경우',
    icon: PhoneCall,
    guide: '긴급 상황은 WorkHere가 아니라 112 또는 119에 바로 연락해야 합니다. 주변 사람에게 위치를 공유하세요.',
    applies: ['생명·신체 위험', '즉시 구조 필요', '폭행 또는 사고 현장', '응급 치료 필요'],
    firstCheck: ['지금 안전한 장소인지', '112 또는 119에 전화할 수 있는지', '현재 위치를 말할 수 있는지'],
    prepare: ['현재 위치', '발생 상황', '다친 사람 수', '연락 가능한 보호자'],
    supportPlaces: ['112 경찰', '119 구급', '가까운 병원'],
    mapCategory: '안전/산재',
  },
]
const helpCategoryIcons: Record<string, typeof HeartHandshake> = {
  receipt: ReceiptText,
  shield: ShieldAlert,
  check: CheckCircle2,
  cross: Cross,
  home: Home,
  message: MessageCircle,
  landmark: Landmark,
  phone: PhoneCall,
  pill: Pill,
  heart: HeartHandshake,
}
const rawHelpCategories: HelpCategory[] = seedHelpCategories.length
  ? seedHelpCategories
  : fallbackHelpTypes.map((item) => ({
      id: item.id,
      title: item.title,
      shortTitle: item.title,
      description: item.description,
      icon: 'heart',
      issueTypes: [item.id],
      applies: item.applies,
      firstCheck: item.firstCheck,
      prepare: item.prepare,
      relatedArticles: [],
      communityTag: item.title,
      mapCategory: item.mapCategory,
    }))
const helpTypes: HelpCategoryView[] = rawHelpCategories.map((item) => ({
  ...item,
  icon: helpCategoryIcons[item.icon] || HeartHandshake,
}))
const regionOptions = [
  { region1: '경기', region2: '안산', value: '경기 안산' },
  { region1: '경기', region2: '시흥', value: '경기 시흥' },
  { region1: '충북', region2: '오창', value: '충북 오창' },
  { region1: '충북', region2: '음성', value: '충북 음성' },
  { region1: '경남', region2: '김해', value: '경남 김해' },
  { region1: '경남', region2: '창원', value: '경남 창원' },
  { region1: '충남', region2: '천안', value: '충남 천안' },
  { region1: '전남', region2: '광주', value: '전남 광주' },
]
const languageFilterOptions: Array<{ value: 'all' | Language; label: string }> = [
  { value: 'all', label: '모든 언어' },
  { value: 'ko', label: '한국어' },
  { value: 'en', label: 'English' },
  { value: 'vi', label: 'Tiếng Việt' },
]

const commonPolicyNotices = [
  'WorkHere Korea는 외국인 근로자의 한국 생활을 돕기 위한 정보 플랫폼입니다.',
  'WorkHere Korea는 긴급 신고를 대체하지 않습니다.',
  '긴급한 생명·신체 위험이 있는 경우 즉시 112 또는 119에 신고하세요.',
]
const jobPolicyNotices = [
  '일자리 정보는 참고용입니다.',
  '근로계약, 비자, 채용 가능 여부는 반드시 공식 절차와 사업장을 통해 확인하세요.',
  '수수료 요구, 여권 보관, 허위 근로조건 제시는 신고 대상입니다.',
]
const communityPolicyNotices = [
  '욕설, 혐오, 불법 알선, 허위 정보, 개인정보 노출 콘텐츠는 삭제될 수 있습니다.',
  '타인의 얼굴, 연락처, 외국인등록번호, 여권, 사업장 내부 사진이 노출되지 않도록 주의하세요.',
]
const placePolicyNotices = [
  '사용자가 제보한 장소는 관리자 검수 후 노출됩니다.',
  '잘못된 장소 정보는 수정 요청 또는 신고할 수 있습니다.',
]
const helpPolicyNotices = [
  '도움요청은 공식 신고가 아니며, 관련 기관 정보 안내와 기록 관리를 위한 기능입니다.',
  '긴급 상황은 반드시 112, 119 또는 관련 공식 기관에 직접 연락해야 합니다.',
]
const policyNotices = [...commonPolicyNotices, ...jobPolicyNotices, ...communityPolicyNotices, ...placePolicyNotices, ...helpPolicyNotices]

const qaScenarios: QaScenario[] = [
  { id: 1, title: '병원 찾기', path: '홈 > 병원 검색 > 생활지도 > 병원 상세 > 저장', expected: 'search_performed, place_viewed, place_saved 기록', status: 'ready' },
  { id: 2, title: '일상 피드 이용', path: '일상 > 피드 조회 > 좋아요 > 댓글 > 장소 태그', expected: 'feed_viewed, feed_liked, feed_commented, place_viewed 기록', status: 'ready' },
  { id: 3, title: '월급 문제 질문', path: '커뮤니티 > 글쓰기 > 급여계산기 > 도움요청', expected: 'post_created, salary_calculated, help_report_submitted 기록', status: 'ready' },
  { id: 4, title: '부적절 게시물 신고', path: '피드/게시글 신고 > 관리자 신고 확인 > 숨김/삭제', expected: 'report_submitted와 admin_logs 처리 이력 저장', status: 'ready' },
  { id: 5, title: '장소 제보', path: '생활지도 > 신규 장소 제보 > 관리자 승인 > 지도 노출', expected: 'place_reported 후 승인 시 목록 노출', status: 'ready' },
  { id: 6, title: '일자리 상세 확인 후 저장', path: '일자리 > 상세 > 저장', expected: 'job_viewed와 job_saved 기록', status: 'ready' },
]

const betaAccounts: BetaAccount[] = [
  { role: '베트남 사용자', email: 'vietnam.worker@workhere.test', password: 'test1234', language: 'vi', profile: 'Vietnam · 경기 안산 · E-9', interests: '일자리, 의료, 노동상담', memo: '일상 피드와 병원/급여 시나리오 검증' },
  { role: '태국 사용자', email: 'thai.worker@workhere.test', password: 'test1234', language: 'en', profile: 'Thailand · 경남 김해 · H-2', interests: '생활지도, 커뮤니티, 숙소', memo: '지도, 커뮤니티 질문 흐름 검증' },
  { role: '중국 사용자', email: 'china.worker@workhere.test', password: 'test1234', language: 'ko', profile: 'China · 서울 영등포구 · F-6', interests: '행정, 병원, 한국어교육', memo: '언어 설정과 장소 저장 검증' },
  { role: '우즈베키스탄 사용자', email: 'uzbek.worker@workhere.test', password: 'test1234', language: 'en', profile: 'Uzbekistan · 충남 천안 · E-9', interests: '급여, 계약, 도움요청', memo: '월급 문제 질문과 도움요청 검증' },
  { role: '한국 관리자', email: 'admin@workhere.test', password: 'admin1234', language: 'ko', profile: 'Korea · 관리자', interests: '신고, 검수, 운영로그', memo: '신고/검수/버그 리포트 처리' },
  { role: '기업 사용자', email: 'company@workhere.test', password: 'company1234', language: 'ko', profile: '기업 · 경기 안산', interests: '일자리 등록, 검수 상태', memo: '일자리 등록 후 관리자 검수 확인' },
  { role: '비회원 상태', email: 'guest', password: '-', language: 'guest', profile: '로그인 전', interests: '언어 선택, 공개 정보 탐색', memo: '스플래시, 언어 선택, 검색 진입 제한 확인' },
]

const initialBugReports: BugReport[] = [
  { id: 1, screenName: '지도', issueType: 'UX 확인', path: '지도 > 병원 필터', description: '병원 필터 후 상세 이동이 자연스러운지 베타 테스트 필요', severity: '보통', status: '접수', ownerMemo: 'QA 1차 라운드에서 확인', createdAt: '2026-05-29', updatedAt: '2026-05-29' },
  { id: 2, screenName: '도움요청', issueType: '정책 문구', path: '도움 요청 > 접수', description: '긴급 신고 대체 아님 문구가 충분히 눈에 띄는지 확인', severity: '높음', status: '확인 중', ownerMemo: '다국어 문구 보강 예정', createdAt: '2026-05-29', updatedAt: '2026-05-29' },
]

function App() {
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem('workhere-language') as Language) || 'ko')
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [screen, setScreen] = useState<Screen>('splash')
  const [users, setUsers] = useState<User[]>(seedUsers)
  const [jobs, setJobs] = useState<Job[]>(seedJobs)
  const [places, setPlaces] = useState<Place[]>(seedPlaces)
  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [communityGroups, setCommunityGroups] = useState<CommunityGroup[]>(seedCommunityGroups)
  const [communityBoards] = useState<CommunityBoard[]>(seedCommunityBoards)
  const [communityMemberships, setCommunityMemberships] = useState<CommunityMembership[]>(seedCommunityMemberships)
  const [dailyFeeds, setDailyFeeds] = useState<DailyFeed[]>(initialDailyFeeds)
  const [helpRequests, setHelpRequests] = useState<HelpReport[]>(initialReports)
  const [adminReports, setAdminReports] = useState<AdminReport[]>(initialAdminReports)
  const [adminLogs, setAdminLogs] = useState<AdminLog[]>(initialAdminLogs)
  const [noticeRecords, setNoticeRecords] = useState<Notice[]>(seedNoticeRecords)
  const [banners, setBanners] = useState<Banner[]>(seedBanners)
  const [analyticsEvents, setAnalyticsEvents] = useState<AnalyticsEvent[]>([])
  const [bugReports, setBugReports] = useState<BugReport[]>(initialBugReports)
  const [selectedJob, setSelectedJob] = useState<Job>(seedJobs[0])
  const [selectedPlace, setSelectedPlace] = useState<Place>(seedPlaces[0])
  const [selectedPost, setSelectedPost] = useState<Post>(initialPosts[0])
  const [selectedCommunityGroup, setSelectedCommunityGroup] = useState<CommunityGroup>(seedCommunityGroups[0])
  const [selectedHelpTypeId, setSelectedHelpTypeId] = useState(helpTypes[0].id)
  const [helpSubmitMessage, setHelpSubmitMessage] = useState('')
  const [isHelpRequestModalOpen, setIsHelpRequestModalOpen] = useState(false)
  const [isDailyComposerOpen, setIsDailyComposerOpen] = useState(false)
  const [dailyToast, setDailyToast] = useState('')
  const [dailyFilter, setDailyFilter] = useState('all')
  const [selectedJobRegionCodes, setSelectedJobRegionCodes] = useState<string[]>([])
  const [selectedJobVisaTypes, setSelectedJobVisaTypes] = useState<VisaType[]>(['E-9'])
  const [showRestrictedJobs, setShowRestrictedJobs] = useState(false)
  const [placeFilters, setPlaceFilters] = useState<string[]>(defaultPlaceFilters)
  const [communityFilters, setCommunityFilters] = useState({
    region: 'all',
    country: 'all',
    language: 'all',
    visa: 'all',
    joinMode: 'all',
    verification: 'all',
  })
  const [selectedBoardId, setSelectedBoardId] = useState('all')
  const [selectedCommunityFilterIds, setSelectedCommunityFilterIds] = useState<string[]>(['all'])
  const [isCommunityFilterSheetOpen, setIsCommunityFilterSheetOpen] = useState(false)
  const [communityToast, setCommunityToast] = useState('')
  const [blockedAuthorIds, setBlockedAuthorIds] = useState<number[]>([])
  const [translatedPostIds, setTranslatedPostIds] = useState<number[]>([])
  const [placeRegionQuery, setPlaceRegionQuery] = useState('충북 오창')
  const [placeLanguageFilter, setPlaceLanguageFilter] = useState<'all' | Language>('all')
  const [translatedFeedIds, setTranslatedFeedIds] = useState<number[]>([])
  const [isBottomNavCompact, setIsBottomNavCompact] = useState(false)
  const [profile, setProfile] = useState<UserProfile>({
    nationality: 'Vietnam',
    region: '경기 안산',
    visa: 'E-9',
    interests: ['일자리', '의료', '노동상담'],
  })
  const [salaryInput, setSalaryInput] = useState({ hourly: 10500, hours: 8, days: 22 })

  const t = translations[language]
  const currentUserId = 1
  const visiblePosts = posts.filter((post) => !post.deleted && !post.hidden && !blockedAuthorIds.includes(post.authorId || -1))
  const visibleFeeds = dailyFeeds.filter((feed) => !feed.deleted && !feed.hidden)
  const visibleCommunityGroups = communityGroups.filter((group) => !group.hidden)
  const approvedJobs = jobs.filter((job) => job.approvalStatus === 'approved' && !job.hidden && !job.deleted)
  const approvedPlaces = places.filter((place) => place.approvalStatus === 'approved')
  const jobRegionOptions = flattenJobRegions(jobRegions)
  const selectedJobVisaType = selectedJobVisaTypes[0] || 'UNKNOWN'
  const selectedRegionLabels = selectedJobRegionCodes
    .map((code) => jobRegionOptions.find((region) => region.code === code)?.name || code)
  const selectedVisaLabels = selectedJobVisaTypes.map((visaType) => visaTypeOptions.find((option) => option.value === visaType)?.shortLabel || visaType)
  const activeJobFilterCount = selectedJobRegionCodes.length + selectedJobVisaTypes.length + (showRestrictedJobs ? 1 : 0)
  const filteredJobsWithMatch = approvedJobs
    .map((job) => ({ job, match: getBestJobVisaMatch(job, selectedJobVisaTypes), regionMatched: matchesJobRegion(job, selectedJobRegionCodes) }))
    .filter(({ regionMatched }) => regionMatched)
    .filter(({ match }) => showRestrictedJobs || match.status !== 'restricted')
    .sort((a, b) => a.match.rank - b.match.rank || a.job.id - b.job.id)
  const filteredJobs = filteredJobsWithMatch.map(({ job }) => job)
  const selectedJobVisaMatch = getVisaJobMatch(selectedJob, selectedJobVisaType)
  const placeRegionKeyword = placeRegionQuery.trim()
  const placeRegionFilterKeyword = placeRegionKeyword === '충북 오창' ? '충북 청주' : placeRegionKeyword
  const filteredPlaces = approvedPlaces
    .filter((place) => placeFilters.includes(place.category))
    .filter((place) => !placeRegionFilterKeyword || `${place.region} ${place.address}`.includes(placeRegionFilterKeyword))
    .filter((place) => placeLanguageFilter === 'all' || place.languages.includes(placeLanguageFilter))
    .sort((a, b) => (a.distanceKm || 99) - (b.distanceKm || 99))
  const filteredFeeds = filterDailyFeeds(visibleFeeds, dailyFilter, profile, currentUserId)
  const filteredCommunityGroups = filterCommunityGroups(visibleCommunityGroups, communityFilters)
  const selectedGroupBoards = communityBoards
    .filter((board) => board.groupId === 'common' || board.groupId === selectedCommunityGroup.id)
    .sort((a, b) => a.sortOrder - b.sortOrder)
  const selectedGroupPosts = visiblePosts
    .filter((post) => post.groupId === selectedCommunityGroup.id)
    .filter((post) => selectedBoardId === 'all' || post.boardId === selectedBoardId)
  const currentGroupMembership = communityMemberships.find((membership) => membership.groupId === selectedCommunityGroup.id && membership.userId === currentUserId)
  const selectedHelpType = helpTypes.find((item) => item.id === selectedHelpTypeId) || helpTypes[0]
  const selectedHelpInstitutions = supportInstitutionsForCategory(selectedHelpType, seedSupportInstitutions)
  const detectedPostHelpCategory = detectHelpCategoryFromText(`${selectedPost.title} ${selectedPost.body}`, helpTypes)
  const selectedPostGroup = communityGroups.find((group) => group.id === selectedPost.groupId)
  const selectedPostBoard = communityBoards.find((board) => board.id === selectedPost.boardId)
  const selectedPostMembership = communityMemberships.find((membership) => membership.groupId === selectedPost.groupId && membership.userId === currentUserId)
  const selectedPostNavigation = getCommunityPostNavigation(selectedPost, visiblePosts)
  const popularDetailPosts = getPopularCommunityPosts(selectedPost, visiblePosts)
  const joinedGroups = communityMemberships
    .filter((membership) => membership.userId === currentUserId && membership.status === 'joined')
    .map((membership) => communityGroups.find((group) => group.id === membership.groupId))
    .filter((group): group is CommunityGroup => Boolean(group))
  const pendingGroupMemberships = communityMemberships.filter((membership) => membership.status === 'pending')
  const personalizedFeeds = rankByProfile(visibleFeeds, profile)
  const personalizedPlaces = rankByProfile(approvedPlaces, profile)
  const personalizedPosts = rankPosts(visiblePosts, profile)
  const rankedCommunityPosts = rankCommunityFeedPosts(visiblePosts, visibleCommunityGroups, profile, language)
  const publicFeedPosts = filterCommunityFeedPosts(rankedCommunityPosts, selectedCommunityFilterIds, visibleCommunityGroups)
  const recommendedGroups = rankCommunityGroups(visibleCommunityGroups, profile)
  const featuredCommunityGroups = ['jeonbuk-e9-e8', 'ansan-vn', 'national-safety']
    .map((groupId) => visibleCommunityGroups.find((group) => group.id === groupId))
    .filter((group): group is CommunityGroup => Boolean(group))
  const communityHomeGroups = featuredCommunityGroups.length ? featuredCommunityGroups : recommendedGroups.slice(0, 3)
  const safetyCommunityGroup = visibleCommunityGroups.find((group) => group.isSafetyFocused) || visibleCommunityGroups[0] || communityGroups[0]
  const publishedBanners = banners.filter((banner) => banner.published)
  const publishedNotices = noticeRecords.filter((notice) => notice.published)
  const comments = buildCommentRows(posts, dailyFeeds)
  const showShell = !['splash', 'language', 'login', 'onboarding'].includes(screen)
  const handleHeaderBack = () => {
    const fallback = getHeaderBackScreen(screen, selectedPost)
    go(fallback)
  }

  useEffect(() => {
    const theme = isDarkMode ? 'dark' : 'light'
    localStorage.setItem('workhere-theme', theme)
    document.documentElement.dataset.theme = theme
    document.body.classList.toggle('theme-dark', isDarkMode)
    document.body.classList.toggle('theme-light', !isDarkMode)
  }, [isDarkMode])

  useEffect(() => {
    if (!isDailyComposerOpen) return undefined
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [isDailyComposerOpen])

  useEffect(() => {
    if (!isCommunityFilterSheetOpen) return undefined
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [isCommunityFilterSheetOpen])

  useEffect(() => {
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    })
  }, [screen])

  useEffect(() => {
    if (!showShell) return undefined
    let timeoutId: number | undefined
    const handleScroll = () => {
      if (timeoutId !== undefined) window.clearTimeout(timeoutId)
      setIsBottomNavCompact(true)
      timeoutId = window.setTimeout(() => setIsBottomNavCompact(false), 180)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      if (timeoutId !== undefined) window.clearTimeout(timeoutId)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [showShell])

  const dashboard = useMemo(
    () => ({
      totalUsers: users.length,
      todayUsers: 1,
      totalFeeds: dailyFeeds.filter((feed) => !feed.deleted).length,
      todayFeeds: dailyFeeds.filter((feed) => feed.createdAt.includes('오늘') || feed.createdAt.includes('방금')).length,
      totalPosts: posts.filter((post) => !post.deleted).length,
      todayPosts: posts.filter((post) => post.author === 'Me').length,
      todayPlaceViews: analyticsEvents.filter((event) => event.name === 'place_viewed').length,
      todayJobViews: analyticsEvents.filter((event) => event.name === 'job_viewed').length,
      openReports: adminReports.filter((report) => report.status === 'received' || report.status === 'reviewing').length,
      openHelp: helpRequests.filter((report) => report.status === 'received' || report.status === 'reviewing').length,
      newPlaces: places.filter((place) => place.approvalStatus === 'pending').length,
      newJobs: jobs.filter((job) => job.approvalStatus === 'pending' && !job.deleted).length,
      popularRegion: mostFrequent(dailyFeeds.map((feed) => feed.region)),
      popularLanguage: '한국어, 베트남어',
      topPlace: topEventDetail(analyticsEvents, 'place_viewed'),
      topJob: topEventDetail(analyticsEvents, 'job_viewed'),
      notices: noticeRecords.length,
      banners: banners.length,
    }),
    [adminReports, analyticsEvents, banners, dailyFeeds, helpRequests, jobs, noticeRecords, places, posts, users],
  )
  const monthlyPay = useMemo(
    () => salaryInput.hourly * salaryInput.hours * salaryInput.days,
    [salaryInput.days, salaryInput.hourly, salaryInput.hours],
  )

  const mainTabs: NavItem[] = [
    { screen: 'home', label: t.home, icon: Home },
    { screen: 'daily', label: t.daily, icon: Camera },
    { screen: 'jobs', label: t.jobs, icon: BriefcaseBusiness },
    { screen: 'places', label: t.map, icon: Map },
    { screen: 'community', label: t.community, icon: MessageCircle },
  ]

  const setLang = (next: Language) => {
    setLanguage(next)
    localStorage.setItem('workhere-language', next)
    trackEvent('language_selected', 'language', next)
  }

  const go = (next: Screen) => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setScreen(next)
  }

  const toggleJobRegion = (code: string) => {
    setSelectedJobRegionCodes((current) => {
      if (code === 'ALL') return []
      return current.includes(code) ? current.filter((item) => item !== code) : [...current, code]
    })
  }

  const toggleJobVisa = (visaType: VisaType) => {
    setSelectedJobVisaTypes((current) => {
      if (visaType === 'ALL') return []
      return current.includes(visaType) ? current.filter((item) => item !== visaType) : [...current, visaType]
    })
  }

  const resetJobFilters = () => {
    setSelectedJobRegionCodes([])
    setSelectedJobVisaTypes([])
    setShowRestrictedJobs(false)
  }

  const logAction = (action: string, target: string, detail: string) => {
    setAdminLogs((logs) => [
      { id: logs.length + 1, admin: '운영자', action, target, detail, createdAt: '방금 전' },
      ...logs,
    ])
  }

  const trackEvent = (name: AnalyticsEventName, eventScreen = screen, detail = '') => {
    setAnalyticsEvents((events) => [
      { id: events.length + 1, name, screen: eventScreen, detail, createdAt: '방금 전' },
      ...events,
    ])
  }

  const handleSearch = (keyword: string) => {
    if (!keyword.trim()) return
    const nextKeyword = keyword.trim()
    trackEvent('search_performed', screen, nextKeyword)
    if (nextKeyword.includes('병원') || nextKeyword.includes('상담') || nextKeyword.includes('산재')) {
      setPlaceFilters([nextKeyword.includes('상담') ? '상담기관' : nextKeyword.includes('산재') ? '안전/산재' : '병원'])
      go('places')
      return
    }
    if (nextKeyword.includes('병원')) {
      setPlaceFilters(['병원'])
      go('places')
    }
  }

  const openLifeMap = (category = 'all', region = profile.region) => {
    setPlaceFilters(category === 'all' ? [...defaultPlaceFilters] : [category])
    setPlaceRegionQuery(region)
    go('places')
  }

  const openHomeBanner = (banner: HomeBanner) => {
    if (banner.href.startsWith('/jobs')) {
      if (banner.href.includes('filter=visa')) {
        setSelectedJobVisaTypes([profile.visa as VisaType])
      }
      go('jobs')
      return
    }
    if (banner.href.startsWith('/map')) {
      openLifeMap(banner.href.includes('category=hospital') ? '병원' : 'all')
      return
    }
    if (banner.href.startsWith('/community')) {
      const groupId = new URLSearchParams(banner.href.split('?')[1] || '').get('group')
      const group = groupId ? communityGroups.find((item) => item.id === groupId) : undefined
      if (group) {
        openCommunityGroup(group)
        return
      }
      go('community')
      return
    }
    go('home')
  }

  const openCommunityGroup = (group: CommunityGroup) => {
    setSelectedCommunityGroup(group)
    setSelectedBoardId('all')
    go('communityGroupDetail')
  }

  const updateCommunityFilter = (key: keyof typeof communityFilters, value: string) => {
    setCommunityFilters((filters) => ({ ...filters, [key]: value }))
  }

  const toggleCommunityIntentFilter = (filterId: string) => {
    setSelectedCommunityFilterIds((current) => {
      if (filterId === 'all') return ['all']
      const withoutAll = current.filter((id) => id !== 'all')
      const next = withoutAll.includes(filterId) ? withoutAll.filter((id) => id !== filterId) : [...withoutAll, filterId]
      return next.length ? next : ['all']
    })
  }

  const resetCommunityIntentFilters = () => {
    setSelectedCommunityFilterIds(['all'])
  }

  const joinCommunityGroup = (group: CommunityGroup) => {
    const existing = communityMemberships.find((membership) => membership.groupId === group.id && membership.userId === currentUserId)
    const status = group.joinMode === 'approval' ? 'pending' : 'joined'
    const policy = evaluateCommunityJoinPolicy({ group, profile, user: users.find((user) => user.id === currentUserId) })
    if (group.joinMode === 'conditional' && !policy.allowed) {
      logAction('조건형 그룹 가입 제한', group.name, policy.missingConditions.join(', ') || group.requiredConditions.join(', '))
      return
    }
    if (existing) {
      setCommunityMemberships((items) =>
        items.map((membership) =>
          membership.groupId === group.id && membership.userId === currentUserId
            ? { ...membership, status }
            : membership,
        ),
      )
    } else {
      setCommunityMemberships([
        { groupId: group.id, userId: currentUserId, role: 'member', status, joinedAt: '방금 전' },
        ...communityMemberships,
      ])
    }
    logAction(group.joinMode === 'approval' ? '그룹 가입 신청' : '그룹 가입', group.name, communityJoinModeLabel[group.joinMode])
  }

  const updateCommunityGroup = (groupId: string, patch: Partial<CommunityGroup>, action: string) => {
    const group = communityGroups.find((item) => item.id === groupId)
    setCommunityGroups((items) => items.map((item) => (item.id === groupId ? { ...item, ...patch } : item)))
    logAction(action, group?.name || groupId, patch.moderationMemo || '커뮤니티 그룹 운영 상태 변경')
  }

  const updateCommunityMembership = (groupId: string, userId: number, status: CommunityMembershipStatus, role?: CommunityMemberRole) => {
    const group = communityGroups.find((item) => item.id === groupId)
    const user = users.find((item) => item.id === userId)
    setCommunityMemberships((items) =>
      items.map((membership) =>
        membership.groupId === groupId && membership.userId === userId
          ? { ...membership, status, role: role || membership.role, joinedAt: status === 'joined' ? '방금 전' : membership.joinedAt }
          : membership,
      ),
    )
    logAction(status === 'joined' ? '그룹 멤버 승인' : status === 'blocked' ? '그룹 멤버 차단' : '그룹 멤버 상태 변경', group?.name || groupId, `${user?.name || userId} → ${communityMembershipStatusLabel[status]}`)
  }

  const applyConditionalPolicyReview = (group: CommunityGroup) => {
    const policy = evaluateCommunityJoinPolicy({ group, profile, user: users.find((user) => user.id === currentUserId) })
    logAction('조건형 그룹 정책 검증', group.name, policy.allowed ? '현재 사용자 가입 가능' : `부족 조건: ${policy.missingConditions.join(', ')}`)
  }

  const reportCommunityGroup = (group: CommunityGroup) => {
    if (!group) return
    setAdminReports([
      {
        id: `RP-${300 + adminReports.length}`,
        targetType: 'group',
        targetId: group.id,
        reason: '커뮤니티 그룹 신고: 사기, 허위 일자리, 개인정보 노출 가능성',
        status: 'received',
        reporter: 'Me',
        createdAt: '방금 전',
      },
      ...adminReports,
    ])
    setCommunityToast('신고가 접수되었습니다. 운영자가 검토합니다.')
    trackEvent('report_submitted', 'community', `group:${group.id}`)
    logAction('그룹 신고 접수', group.name, '운영자가 검토합니다')
  }

  const blockPostAuthor = (post: Post) => {
    if (!post.authorId) return
    setBlockedAuthorIds((ids) => (ids.includes(post.authorId || -1) ? ids : [...ids, post.authorId || -1]))
    setCommunityToast('차단한 사용자의 글을 공개 피드에서 숨겼습니다.')
    logAction('커뮤니티 사용자 차단', post.author, '차단한 사용자의 글과 댓글을 숨김')
  }

  const togglePostTranslation = (postId: number) => {
    setTranslatedPostIds((ids) => (ids.includes(postId) ? ids.filter((id) => id !== postId) : [...ids, postId]))
  }

  const updateUser = (name: string, patch: Partial<User>, action: string) => {
    setUsers((items) => items.map((user) => (user.name === name ? { ...user, ...patch } : user)))
    logAction(action, name, patch.status === 'blocked' ? '글쓰기와 댓글 작성 제한' : '사용자 상태 갱신')
  }

  const warnUser = (name: string) => {
    const user = users.find((item) => item.name === name)
    updateUser(name, { status: 'warned', warnings: (user?.warnings ?? 0) + 1 }, '작성자 경고')
  }

  const blockUser = (name: string) => updateUser(name, { status: 'blocked' }, '작성자 차단')

  const toggleJobSave = (jobId: number) => {
    const nextJobs = jobs.map((job) => (job.id === jobId ? { ...job, saved: !job.saved } : job))
    setJobs(nextJobs)
    setSelectedJob(nextJobs.find((job) => job.id === jobId) ?? selectedJob)
    trackEvent('job_saved', 'jobs', `job:${jobId}`)
  }

  const togglePlaceSave = (placeId: number) => {
    const nextPlaces = places.map((place) => (place.id === placeId ? { ...place, saved: !place.saved } : place))
    setPlaces(nextPlaces)
    setSelectedPlace(nextPlaces.find((place) => place.id === placeId) ?? selectedPlace)
    trackEvent('place_saved', 'places', `place:${placeId}`)
  }

  const updateFeed = (feedId: number, patch: Partial<DailyFeed>, action = '피드 수정') => {
    setDailyFeeds((feeds) => feeds.map((feed) => (feed.id === feedId ? { ...feed, ...patch } : feed)))
    const feed = dailyFeeds.find((item) => item.id === feedId)
    if (feed) logAction(action, `피드 #${feedId}`, feed.body.slice(0, 36))
  }

  const submitDaily = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const imageFiles = form
      .getAll('images')
      .filter((file): file is File => file instanceof File && Boolean(file.name))
    const placeName = String(form.get('place') || '')
    const linkedPlace = places.find((place) => place.name === placeName)
    const body = String(form.get('body') || '')
    const fallbackImage = 'https://picsum.photos/seed/workhere-daily-note/900/1125'
    const images = imageFiles.length
      ? imageFiles.map((file, index) => ({
          id: index + 1,
          url: `https://picsum.photos/seed/workhere-upload-${dailyFeeds.length + 1}-${index + 1}/900/1125`,
          alt: file.name,
        }))
      : [{ id: 1, url: fallbackImage, alt: 'WorkHere Korea daily note' }]
    const nextFeed: DailyFeed = {
      id: dailyFeeds.length + 1,
      image: images[0].url,
      images,
      author: 'Me',
      nationality: String(form.get('nationality') || profile.nationality),
      region: String(form.get('region') || profile.region),
      createdAt: '방금 전',
      body,
      translatedBody: 'Translation preview will appear here.',
      category: String(form.get('category') || '한국생활') as DailyCategory,
      hashtags: [`#${String(form.get('region') || profile.region).split(' ').at(-1)}`, `#${String(form.get('category') || '한국생활')}`],
      placeId: linkedPlace?.id,
      likes: 0,
      comments: [],
      saved: false,
      reported: 0,
      visibility: String(form.get('visibility') || 'public') as DailyVisibility,
    }
    setDailyFeeds([nextFeed, ...dailyFeeds])
    setIsDailyComposerOpen(false)
    setDailyToast('일상이 등록되었습니다.')
    trackEvent('feed_created', 'dailyCreate', nextFeed.category)
    go('daily')
  }

  const submitPost = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const image = form.get('image') as File
    const nextPost: Post = {
      id: posts.length + 1,
      groupId: selectedCommunityGroup.id,
      boardId: String(form.get('boardId') || selectedBoardId || 'qna'),
      title: String(form.get('title') || '새 게시글'),
      author: 'Me',
      category: String(form.get('category') || '생활질문'),
      body: String(form.get('body') || ''),
      languageCode: language,
      originalLanguage: languages.find((item) => item.code === language)?.native || '한국어',
      translatedText: '번역 준비 중입니다. 베타 테스트에서는 원문과 함께 표시됩니다.',
      isSafetyReport: String(form.get('boardId') || selectedBoardId).includes('safety') || String(form.get('category') || '').includes('도움'),
      likeCount: 0,
      commentCount: 0,
      viewCount: 1,
      comments: [],
      reported: 0,
      images: image?.name ? [image.name] : [],
    }
    setPosts([nextPost, ...posts])
    setSelectedPost(nextPost)
    trackEvent('post_created', 'postCreate', nextPost.category)
    go('postDetail')
  }

  const submitQuickHelp = () => {
    setIsHelpRequestModalOpen(true)
  }

  const submitHelpRequestModal = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const nextReport: HelpReport = {
      id: `H-${1030 + helpRequests.length}`,
      type: String(form.get('type') || selectedHelpType.title),
      status: 'received',
      content: [
        `지역: ${String(form.get('region') || profile.region)}`,
        `선호 언어: ${String(form.get('language') || language)}`,
        `연락 가능 여부: ${String(form.get('contactable') || '확인 필요')}`,
        `내용: ${String(form.get('content') || '')}`,
      ].join(' / '),
    }
    setHelpRequests([nextReport, ...helpRequests])
    setHelpSubmitMessage('요청이 접수되었습니다. 운영자가 확인 후 안내합니다.')
    setIsHelpRequestModalOpen(false)
    trackEvent('help_report_submitted', 'help', selectedHelpType.title)
    logAction('도움 요청 접수', selectedHelpType.title, '공식 신고 대체 아님 안내 포함')
  }

  const reportPost = () => {
    const nextPosts = posts.map((post) =>
      post.id === selectedPost.id ? { ...post, reported: post.reported + 1 } : post,
    )
    setPosts(nextPosts)
    setSelectedPost(nextPosts.find((post) => post.id === selectedPost.id) ?? selectedPost)
    setAdminReports([
      {
        id: `RP-${300 + adminReports.length}`,
        targetType: 'post',
        targetId: String(selectedPost.id),
        reason: selectedPost.isSafetyReport ? '사기·허위 일자리 또는 임금체불 의심' : '커뮤니티 게시글 신고',
        status: 'received',
        reporter: 'Me',
        createdAt: '방금 전',
      },
      ...adminReports,
    ])
    trackEvent('report_submitted', 'postDetail', `post:${selectedPost.id}`)
    logAction('커뮤니티 신고 접수', selectedPost.title, '운영자가 검토합니다')
  }

  const reportCommunityPost = (post: Post) => {
    setPosts((items) => items.map((item) => (item.id === post.id ? { ...item, reported: item.reported + 1 } : item)))
    setAdminReports([
      {
        id: `RP-${300 + adminReports.length}`,
        targetType: 'post',
        targetId: String(post.id),
        reason: post.isSafetyReport ? '사기·허위 일자리 또는 임금체불 의심' : '커뮤니티 게시글 신고',
        status: 'received',
        reporter: 'Me',
        createdAt: '방금 전',
      },
      ...adminReports,
    ])
    setCommunityToast('신고가 접수되었습니다. 운영자가 검토합니다.')
    trackEvent('report_submitted', 'community', `post:${post.id}`)
    logAction('커뮤니티 신고 접수', post.title, '운영자가 검토합니다')
  }

  const reportJob = () => {
    setAdminReports([
      {
        id: `RP-${300 + adminReports.length}`,
        targetType: 'job',
        targetId: String(selectedJob.id),
        reason: '수수료 요구, 여권 보관, 허위 근로조건 의심',
        status: 'received',
        reporter: 'Me',
        createdAt: '방금 전',
      },
      ...adminReports,
    ])
    trackEvent('report_submitted', 'jobDetail', `job:${selectedJob.id}`)
    logAction('일자리 신고 접수', selectedJob.title, '관리자 신고 관리에서 확인 필요')
  }

  const reportPlace = () => {
    setAdminReports([
      {
        id: `RP-${300 + adminReports.length}`,
        targetType: 'place',
        targetId: String(selectedPlace.id),
        reason: '잘못된 장소 정보 또는 개인정보 노출 의심',
        status: 'received',
        reporter: 'Me',
        createdAt: '방금 전',
      },
      ...adminReports,
    ])
    trackEvent('place_reported', 'placeDetail', `place:${selectedPlace.id}`)
    logAction('장소 신고 접수', selectedPlace.name, '관리자 장소/신고 관리에서 확인 필요')
  }

  const updatePost = (postId: number, patch: Partial<Post>, action = '게시글 수정') => {
    const nextPosts = posts.map((post) => (post.id === postId ? { ...post, ...patch } : post))
    setPosts(nextPosts)
    setSelectedPost(nextPosts.find((post) => post.id === selectedPost.id) ?? selectedPost)
    const post = posts.find((item) => item.id === postId)
    if (post) logAction(action, `게시글 #${postId}`, post.title)
  }

  const approveJob = (jobId: number) => {
    const job = jobs.find((item) => item.id === jobId)
    setJobs(jobs.map((item) => (item.id === jobId ? { ...item, approvalStatus: 'approved', hidden: false } : item)))
    logAction('일자리 승인', job?.title || `일자리 #${jobId}`, '승인 시 일자리 목록에 노출')
  }

  const approvePlace = (placeId: number) => {
    const place = places.find((item) => item.id === placeId)
    setPlaces(places.map((item) => (item.id === placeId ? { ...item, approvalStatus: 'approved', reviewHistory: [...(item.reviewHistory || []), '관리자 승인 완료'] } : item)))
    logAction('장소 제보 승인', place?.name || `장소 #${placeId}`, '승인 시 생활지도에 노출')
  }

  const rejectPlace = (placeId: number) => {
    const place = places.find((item) => item.id === placeId)
    setPlaces(places.map((item) => (item.id === placeId ? { ...item, approvalStatus: 'rejected', reviewHistory: [...(item.reviewHistory || []), '수정 요청: 연락처와 운영시간 확인 필요'] } : item)))
    logAction('장소 제보 반려', place?.name || `장소 #${placeId}`, '비노출 및 수정 요청 이력 저장')
  }

  const updateReportStatus = (reportId: string, status: ReportStatus) => {
    const report = adminReports.find((item) => item.id === reportId)
    setAdminReports(adminReports.map((item) => (item.id === reportId ? { ...item, status } : item)))
    logAction('신고 상태 변경', reportId, `${report?.reason || ''} → ${reportStatusLabel[status]}`)
  }

  const moderateReportedContent = (report: AdminReport, action: 'keep' | 'hide' | 'delete') => {
    const targetId = Number(report.targetId)
    if (report.targetType === 'daily') {
      updateFeed(targetId, action === 'keep' ? { hidden: false } : action === 'hide' ? { hidden: true } : { deleted: true }, `신고 콘텐츠 ${action}`)
    }
    if (report.targetType === 'post') {
      updatePost(targetId, action === 'keep' ? { hidden: false } : action === 'hide' ? { hidden: true } : { deleted: true }, `신고 콘텐츠 ${action}`)
    }
    if (report.targetType === 'job') {
      setJobs(jobs.map((job) => (job.id === targetId ? { ...job, hidden: action === 'hide' ? true : job.hidden, deleted: action === 'delete' ? true : job.deleted } : job)))
    }
    if (report.targetType === 'place') {
      setPlaces(places.map((place) => (place.id === targetId ? { ...place, approvalStatus: action === 'delete' ? 'rejected' : place.approvalStatus } : place)))
    }
    if (report.targetType === 'group') {
      setCommunityGroups((groups) =>
        groups.map((group) =>
          group.id === report.targetId
            ? { ...group, hidden: action === 'hide' || action === 'delete', reviewStatus: action === 'delete' ? 'rejected' : group.reviewStatus, moderationMemo: `신고 처리: ${action}` }
            : group,
        ),
      )
    }
    updateReportStatus(report.id, action === 'keep' ? 'rejected' : 'actioned')
    logAction('신고 콘텐츠 조치', `${report.targetType} #${report.targetId}`, action === 'keep' ? '유지' : action === 'hide' ? '숨김' : '삭제')
  }

  const updateHelpStatus = (helpId: string, status: HelpStatus) => {
    const help = helpRequests.find((item) => item.id === helpId)
    setHelpRequests(helpRequests.map((item) => (item.id === helpId ? { ...item, status } : item)))
    logAction('도움 요청 상태 변경', helpId, `${help?.type || ''} → ${helpStatusLabel[status]}`)
  }

  const openPlaceFromFeed = (placeId: number) => {
    const place = places.find((item) => item.id === placeId)
    if (!place) return
    setSelectedPlace(place)
    trackEvent('place_viewed', 'daily', place.name)
    go('placeDetail')
  }

  const openJobFromFeed = (jobId: number) => {
    const job = jobs.find((item) => item.id === jobId)
    if (!job) return
    setSelectedJob(job)
    trackEvent('job_viewed', 'daily', job.title)
    go('jobDetail')
  }

  const shareFeedQuestion = (feed: DailyFeed) => {
    const nextPost: Post = {
      id: posts.length + 1,
      title: `[일상 질문] ${feed.body.slice(0, 24)}...`,
      author: feed.author,
      category: '생활질문',
      body: feed.body,
      comments: [],
      reported: 0,
      images: [],
    }
    setPosts([nextPost, ...posts])
    setSelectedPost(nextPost)
    trackEvent('post_created', 'daily', 'feed_question_shared')
    go('postDetail')
  }

  const submitAdminJob = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const nextJob: Job = {
      id: jobs.length + 1,
      title: String(form.get('title') || '신규 일자리'),
      company: String(form.get('company') || '운영자 등록'),
      region: String(form.get('region') || '경기 안산'),
      visa: ['E-9'],
      wage: Number(form.get('wage') || 10030),
      payLabel: `시급 ${Number(form.get('wage') || 10030).toLocaleString()}원`,
      tags: ['운영자등록'],
      shift: '협의',
      description: String(form.get('description') || '정보 제공용 일자리입니다. 직접 알선이 아닙니다.'),
      source: 'operator',
      approvalStatus: 'approved',
      complianceNote: '운영자 등록. 불법 알선 표현 검토 완료',
    }
    setJobs([nextJob, ...jobs])
    logAction('일자리 등록', nextJob.title, '운영자 신규 등록')
    event.currentTarget.reset()
  }

  const submitPlaceReport = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const nextPlace: Place = {
      id: places.length + 1,
      name: String(form.get('name') || '신규 제보 장소'),
      category: String(form.get('category') || '생활'),
      region: String(form.get('region') || profile.region),
      address: `${String(form.get('region') || profile.region)} 상세 주소 관리자 확인 필요`,
      phone: String(form.get('phone') || '확인 필요'),
      hours: '사용자 제보. 운영시간 확인 필요',
      languages: ['ko', language],
      distanceKm: 0.8,
      isOpen: false,
      services: ['사용자 제보', '관리자 검수 필요'],
      foreignerFriendly: true,
      linkedFeedIds: [],
      linkedPostIds: [],
      reviews: [],
      lat: 37.21,
      lng: 126.84,
      source: 'user',
      approvalStatus: 'pending',
      reviewHistory: ['사용자 장소 제보 접수', '관리자 검토 대기'],
    }
    setPlaces([nextPlace, ...places])
    trackEvent('place_reported', 'places', nextPlace.name)
    logAction('장소 제보 접수', nextPlace.name, '승인 전 비노출')
    event.currentTarget.reset()
  }

  const addPostComment = () => {
    const nextComments = [...selectedPost.comments, '베타 테스트 댓글입니다.']
    updatePost(selectedPost.id, { comments: nextComments }, '댓글 작성')
    trackEvent('post_commented', 'postDetail', `post:${selectedPost.id}`)
  }

  const submitBugReport = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const nextBug: BugReport = {
      id: bugReports.length + 1,
      screenName: String(form.get('screenName') || '홈'),
      issueType: String(form.get('issueType') || '기능 오류'),
      path: String(form.get('path') || ''),
      description: String(form.get('description') || ''),
      severity: String(form.get('severity') || '보통') as BugReport['severity'],
      status: '접수',
      ownerMemo: String(form.get('ownerMemo') || '담당자 배정 전'),
      createdAt: '2026-05-29',
      updatedAt: '2026-05-29',
    }
    setBugReports([nextBug, ...bugReports])
    logAction('버그 리포트 접수', nextBug.screenName, nextBug.description)
    event.currentTarget.reset()
  }

  return (
    <div className={`app-shell lang-${language} ${isDarkMode ? 'theme-dark' : 'theme-light'}`}>
      {showShell ? (
        <aside className="desktop-rail" aria-label="Desktop navigation">
          <button className="brand" onClick={() => go('home')} type="button">
            <img src={workhereLogo} alt={t.appName} />
          </button>
          {mainTabs.map((item) => (
            <TabButton key={item.screen} item={item} active={isTabActive(screen, item.screen)} onClick={() => go(item.screen)} />
          ))}
          <button className="rail-admin" onClick={() => go('admin')} type="button">
            <LayoutDashboard size={18} />
            {t.admin}
          </button>
        </aside>
      ) : null}

      <main className={showShell ? 'content' : 'full-screen'}>
        {showShell ? <Topbar language={language} setLanguage={setLang} t={t} go={go} screen={screen} onBack={handleHeaderBack} onSearch={handleSearch} /> : null}

        {screen === 'splash' && (
          <HeroSection t={t} onStart={() => go('language')} />
        )}

        {screen === 'language' && (
          <AuthPanel icon={<Globe2 size={34} />} title={t.selectLanguage}>
            <div className="language-grid">
              {languages.map((item) => (
                <button className={language === item.code ? 'language-card selected' : 'language-card'} key={item.code} onClick={() => setLang(item.code)} type="button">
                  <strong>{item.native}</strong>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
            <button className="primary-button stretch" onClick={() => go('login')} type="button">{t.complete}</button>
          </AuthPanel>
        )}

        {screen === 'login' && (
          <AuthPanel icon={<LockKeyhole size={32} />} title={t.loginTitle}>
            <label>{t.email}<input defaultValue="worker@example.com" type="email" /></label>
            <label>{t.password}<input defaultValue="workhere" type="password" /></label>
            <div className="button-row">
              <button className="secondary-button" onClick={() => trackEvent('sign_up_completed', 'login', 'test_signup')} type="button">{t.signup}</button>
              <button className="primary-button" onClick={() => go('onboarding')} type="button">{t.login}</button>
            </div>
          </AuthPanel>
        )}

        {screen === 'onboarding' && (
          <AuthPanel icon={<UserRound size={32} />} title={t.onboardingTitle} wide>
            <div className="form-grid">
              <label>{t.nationality}<input value={profile.nationality} onChange={(event) => setProfile({ ...profile, nationality: event.target.value })} /></label>
              <label>{t.region}<input value={profile.region} onChange={(event) => setProfile({ ...profile, region: event.target.value })} /></label>
              <label>{t.visa}<input value={profile.visa} onChange={(event) => {
                const visa = event.target.value
                setProfile({ ...profile, visa })
                if (visaTypeOptions.some((option) => option.value === visa)) setSelectedJobVisaTypes([visa as VisaType])
              }} /></label>
              <label>{t.interests}<input value={profile.interests.join(', ')} onChange={(event) => setProfile({ ...profile, interests: event.target.value.split(',').map((value) => value.trim()) })} /></label>
            </div>
            <button className="primary-button stretch" onClick={() => { trackEvent('onboarding_completed', 'onboarding', `${profile.nationality}/${profile.region}/${profile.visa}`); go('home') }} type="button">{t.complete}</button>
          </AuthPanel>
        )}

        {screen === 'home' && (
          <ScreenFrame title={t.home} subtitle={t.splashLine}>
            <HomeBannerCarousel banners={homeBanners} onOpen={openHomeBanner} />
            <section className="home-hero">
              <p className="eyebrow">WorkHere Korea</p>
              <h2>충북 음성 맞춤 생활정보</h2>
              <p>{profile.visa} 비자와 관심정보 기준으로 지역·국적·언어별 콘텐츠를 추천합니다.</p>
              <div className="button-row hero-cta-row">
                <button className="primary-button" onClick={() => go('daily')} type="button"><Camera size={16} />{t.daily}</button>
                <button className="secondary-button" onClick={() => go('mypage')} type="button"><UserRound size={16} />내 정보</button>
              </div>
            </section>
            <SectionTitle title={t.quickMenu} />
            <div className="quick-grid">
              <QuickButton icon={BriefcaseBusiness} label={t.jobs} onClick={() => go('jobs')} />
              <QuickButton icon={Map} label={t.placeMap} onClick={() => go('places')} />
              <QuickButton icon={Calculator} label={t.salary} onClick={() => go('salary')} />
              <QuickButton icon={HelpRequestIcon} label={t.help} onClick={() => go('help')} />
            </div>
            <div className="split-grid">
              <Panel title={t.todayKoreaLife}>
                {publishedBanners.slice(0, 2).map((banner) => (
                  <article className="mini-banner" key={banner.id}>
                    <img src={assetUrl(banner.image)} alt="" loading="lazy" decoding="async" />
                    <div><strong>{banner.title}</strong><small>{banner.body}</small></div>
                  </article>
                ))}
                {publishedNotices.slice(0, 2).map((notice) => <InfoLine key={notice.id} icon={<Bell size={16} />} text={notice.title} />)}
              </Panel>
              <Panel title={t.popularDailyFeeds}>
                {personalizedFeeds.slice(0, 3).map((feed) => (
                  <ListButton key={feed.id} title={feed.body} meta={`${feed.category} · ${feed.region}`} onClick={() => go('daily')} />
                ))}
              </Panel>
            </div>
            <div className="split-grid">
              <Panel title={t.nearbyPlaces}>
                {personalizedPlaces.slice(0, 3).map((place) => (
                  <ListButton key={place.id} title={place.name} meta={`${place.category} · ${place.region}`} onClick={() => { setSelectedPlace(place); go('placeDetail') }} />
                ))}
              </Panel>
              <Panel title={t.popularQuestions}>
                {personalizedPosts.slice(0, 3).map((post) => (
                  <ListButton key={post.id} title={post.title} meta={`${post.category} · ${post.comments.length} ${t.comment}`} onClick={() => { setSelectedPost(post); go('postDetail') }} />
                ))}
              </Panel>
            </div>
          </ScreenFrame>
        )}

        {screen === 'daily' && (
          <ScreenFrame title={t.dailyTitle} subtitle={t.dailySubtitle}>
            {dailyToast ? <div className="mock-toast daily-toast" role="status"><CheckCircle2 size={18} />{dailyToast}</div> : null}
            <div className="filter-row">
              <select value={dailyFilter} onChange={(event) => setDailyFilter(event.target.value)} aria-label={t.filter}>
                <option value="all">{t.all}</option>
                <option value="mine">내 피드 보기</option>
                <option value="nearby">{t.nearby}</option>
                <option value="nationality">{t.myNationality}</option>
                <option value="region">{t.myRegion}</option>
                <option value="popular">{t.popular}</option>
              </select>
            </div>
            <div className="daily-feed-list">
              {filteredFeeds.map((feed) => (
                <DailyFeedCardV2
                  feed={feed}
                  key={feed.id}
                  t={t}
                  translated={translatedFeedIds.includes(feed.id)}
                  place={places.find((place) => place.id === feed.placeId)}
                  job={jobs.find((job) => job.id === feed.jobId)}
                  onTranslate={() => { setTranslatedFeedIds(toggleId(translatedFeedIds, feed.id)); trackEvent('feed_viewed', 'daily', `feed:${feed.id}`) }}
                  onLike={() => { updateFeed(feed.id, { likes: feed.likes + 1 }, '피드 좋아요'); trackEvent('feed_liked', 'daily', `feed:${feed.id}`) }}
                  onComment={() => { updateFeed(feed.id, { comments: [...feed.comments, '베타 테스트 댓글입니다.'] }, '피드 댓글 작성'); trackEvent('feed_commented', 'daily', `feed:${feed.id}`) }}
                  onSave={() => { updateFeed(feed.id, { saved: !feed.saved }, '피드 저장'); trackEvent('feed_saved', 'daily', `feed:${feed.id}`) }}
                  onReport={() => { updateFeed(feed.id, { reported: feed.reported + 1 }, '피드 신고'); trackEvent('report_submitted', 'daily', `feed:${feed.id}`) }}
                  onHide={() => updateFeed(feed.id, { hidden: true }, '피드 숨김')}
                  onPlace={() => feed.placeId && openPlaceFromFeed(feed.placeId)}
                  onJob={() => feed.jobId && openJobFromFeed(feed.jobId)}
                  onHelp={() => go('help')}
                  onQuestion={() => shareFeedQuestion(feed)}
                />
              ))}
            </div>
            <FloatingActionButton label={t.dailyCreate} onClick={() => { setDailyToast(''); setIsDailyComposerOpen(true) }} />
            {isDailyComposerOpen ? (
              <FeedComposerSheet
                t={t}
                profile={profile}
                places={places}
                onClose={() => setIsDailyComposerOpen(false)}
                onSubmit={submitDaily}
              />
            ) : null}
          </ScreenFrame>
        )}

        {screen === 'dailyCreate' && (
          <DetailFrame title={t.dailyCreate} back={() => go('daily')} backLabel={t.back}>
            <DailyComposerForm t={t} profile={profile} places={places} onSubmit={submitDaily} />
          </DetailFrame>
        )}

        {screen === 'jobs' && (
          <ScreenFrame title={t.jobList} subtitle={t.infoOnly}>
            <section className="job-filter-panel" aria-label="일자리 필터">
              <div className="job-filter-block">
                <div className="job-filter-title">
                  <strong>지역 선택</strong>
                  <span>{selectedRegionLabels.length ? selectedRegionLabels.join(', ') : '전체 지역'}</span>
                </div>
                <div className="job-filter-chip-scroll" aria-label="시도 지역">
                  {jobRegions.map((region) => (
                    <button
                      className={`job-region-chip ${region.code === 'ALL' && selectedJobRegionCodes.length === 0 ? 'active' : selectedJobRegionCodes.includes(region.code) ? 'active' : ''}`}
                      key={region.code}
                      onClick={() => toggleJobRegion(region.code)}
                      type="button"
                    >
                      {region.name}
                    </button>
                  ))}
                </div>
                <div className="job-filter-chip-scroll compact" aria-label="시군구 지역">
                  {jobRegions.flatMap((region) => region.children || []).map((region) => (
                    <button
                      className={`job-region-chip child ${selectedJobRegionCodes.includes(region.code) ? 'active' : ''}`}
                      key={region.code}
                      onClick={() => toggleJobRegion(region.code)}
                      type="button"
                    >
                      {region.name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="active-filter-card">
                <div className="job-filter-title">
                  <strong>선택 조건</strong>
                  {activeJobFilterCount ? <button onClick={resetJobFilters} type="button">전체 초기화</button> : null}
                </div>
                {activeJobFilterCount ? (
                  <div className="active-filter-chips">
                    {selectedJobRegionCodes.map((code) => (
                      <button key={code} onClick={() => toggleJobRegion(code)} type="button">
                        {jobRegionOptions.find((region) => region.code === code)?.name || code}<span>×</span>
                      </button>
                    ))}
                    {selectedJobVisaTypes.map((visaType) => (
                      <button key={visaType} onClick={() => toggleJobVisa(visaType)} type="button">
                        {visaTypeOptions.find((option) => option.value === visaType)?.shortLabel || visaType}<span>×</span>
                      </button>
                    ))}
                    {showRestrictedJobs ? (
                      <button onClick={() => setShowRestrictedJobs(false)} type="button">제한 공고 포함<span>×</span></button>
                    ) : null}
                  </div>
                ) : (
                  <p>지역과 비자를 선택하면 더 정확한 일자리를 볼 수 있어요.</p>
                )}
              </div>
              <div className="visa-filter-card" aria-label="비자 기반 일자리 필터">
              <div className="visa-filter-head">
                <div>
                  <strong>비자 기준 일자리 추천</strong>
                  <p>선택한 비자와 지역을 기준으로 지원 가능성이 높은 공고를 먼저 보여드립니다.</p>
                  <small>지역: {selectedRegionLabels.length ? selectedRegionLabels.join(', ') : '전체'} · 비자: {selectedVisaLabels.length ? selectedVisaLabels.join(', ') : '전체'}</small>
                </div>
                <select value={selectedJobVisaType} onChange={(event) => setSelectedJobVisaTypes(event.target.value === 'ALL' ? [] : [event.target.value as VisaType])} aria-label="전체 비자 선택">
                  {visaTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
              <div className="visa-chip-scroll" role="list" aria-label="주요 비자 필터">
                {visaTypeOptions.filter((option) => primaryJobVisaFilters.includes(option.value)).map((option) => (
                  <button
                    className={`visa-filter-chip ${option.value === 'ALL' && selectedJobVisaTypes.length === 0 ? 'active' : selectedJobVisaTypes.includes(option.value) ? 'active' : ''}`}
                    key={option.value}
                    onClick={() => toggleJobVisa(option.value)}
                    type="button"
                  >
                    {option.shortLabel}
                  </button>
                ))}
              </div>
              <label className="visa-restricted-toggle">
                <input type="checkbox" checked={showRestrictedJobs} onChange={(event) => setShowRestrictedJobs(event.target.checked)} />
                제한 공고도 보기
              </label>
              <p className="visa-filter-notice">{selectedJobVisaTypes.length === 1 ? getVisaFilterNotice(selectedJobVisaType) : getVisaFilterNotice(selectedJobVisaType)}</p>
              <p className="visa-legal-notice">{visaLegalNotice}</p>
              </div>
            </section>
            <div className="job-filter-tools">
              <button className="secondary-button" onClick={() => go('salary')} type="button"><Calculator size={17} />{t.salary}</button>
            </div>
            <div className="job-result-summary">
              <strong>{activeJobFilterCount ? `조건에 맞는 일자리 ${filteredJobs.length}개` : `전체 일자리 ${filteredJobs.length}개`}</strong>
              <span>{showRestrictedJobs ? '제한 공고 포함' : '제한 공고 숨김'}</span>
            </div>
            <div className="card-list">
              {filteredJobsWithMatch.map(({ job, match: visaMatch }) => {
                return (
                  <article className="data-card" key={job.id}>
                    <div className="card-head">
                      <BriefcaseBusiness size={19} />
                      <span>{job.region}</span>
                      <StatusPill label={statusLabel[job.approvalStatus]} />
                      <VisaStatusBadge match={visaMatch} />
                    </div>
                    <h3>{job.title}</h3>
                    <p>{job.company} · {job.shift}</p>
                    <strong>{job.payLabel}</strong>
                    <p className="job-visa-summary">{visaMatch.summary}</p>
                    <div className="chip-row">{job.tags.map((tag) => <span className="chip" key={tag}>{tag}</span>)}</div>
                    <div className="button-row">
                      <button className="secondary-button grow" onClick={() => { setSelectedJob(job); trackEvent('job_viewed', 'jobs', job.title); go('jobDetail') }} type="button">{t.jobDetail}</button>
                      <button className="icon-button" onClick={() => toggleJobSave(job.id)} type="button" title={t.save}><Bookmark size={18} fill={job.saved ? 'currentColor' : 'none'} /></button>
                    </div>
                  </article>
                )
              })}
              {filteredJobs.length === 0 ? (
                <div className="empty-state">
                  <strong>조건에 맞는 일자리가 없습니다.</strong>
                  <p>지역이나 비자 조건을 조금 넓혀보세요.</p>
                  <div className="button-row">
                    <button className="secondary-button grow" onClick={resetJobFilters} type="button">필터 초기화</button>
                    <button className="primary-button grow" onClick={() => setShowRestrictedJobs(true)} type="button">제한 공고도 보기</button>
                  </div>
                </div>
              ) : null}
            </div>
          </ScreenFrame>
        )}

        {screen === 'jobDetail' && (
          <DetailFrame title={t.jobDetail} back={() => go('jobs')} backLabel={t.back}>
            <article className="detail-card">
              <p className="eyebrow">{selectedJob.company}</p>
              <h2>{selectedJob.title}</h2>
              <div className="metric-grid">
                <Metric label={t.region} value={selectedJob.region} />
                <Metric label={t.visa} value={selectedJob.visa.join(', ')} />
                <Metric label={t.hourlyPay} value={selectedJob.payLabel} />
                <Metric label={t.source} value={selectedJob.source === 'operator' ? t.operator : t.userTip} />
              </div>
              <p>{selectedJob.description}</p>
              <PolicyNotice compact items={jobPolicyNotices} />
              <InfoBox icon={<AlertTriangle size={18} />} text={t.infoOnly} />
              <VisaJobNotice visaType={selectedJobVisaType} match={selectedJobVisaMatch} />
              <section className="job-nearby-section" aria-labelledby="job-nearby-title">
                <div className="job-nearby-head">
                  <h3 id="job-nearby-title">사업장 주변 생활도움</h3>
                  <p>근무지 주변에서 필요한 장소를 바로 확인하세요.</p>
                </div>
                <div className="job-nearby-grid">
                  <button className="job-nearby-card" onClick={() => openLifeMap('병원', selectedJob.region)} type="button" aria-label="주변 병원 찾기">
                    <span><HeartPulse size={21} /></span>
                    <strong>주변 병원</strong>
                  </button>
                  <button className="job-nearby-card" onClick={() => openLifeMap('음식점/마트', selectedJob.region)} type="button" aria-label="주변 음식점과 마트 찾기">
                    <span><ShoppingBag size={21} /></span>
                    <strong>음식점/마트</strong>
                  </button>
                  <button className="job-nearby-card" onClick={() => openLifeMap('행정기관', selectedJob.region)} type="button" aria-label="주변 행정 기관 찾기">
                    <span><Building size={21} /></span>
                    <strong>행정 기관</strong>
                  </button>
                </div>
              </section>
              <div className="job-detail-actions">
                <button className="primary-button stretch" onClick={() => toggleJobSave(selectedJob.id)} type="button"><Bookmark size={18} />{t.save}</button>
                <button className="secondary-button danger stretch" onClick={reportJob} type="button"><Flag size={18} />일자리 신고</button>
              </div>
            </article>
          </DetailFrame>
        )}

        {screen === 'salary' && (
          <ScreenFrame title={t.salary} subtitle="시급, 근무시간, 근무일수 기반 예상 급여 계산">
            <div className="calculator-layout">
              <Panel title={t.calculate}>
                <label>{t.hourlyPay}<input type="number" value={salaryInput.hourly} onChange={(event) => setSalaryInput({ ...salaryInput, hourly: Number(event.target.value) })} /></label>
                <label>{t.workHours}<input type="number" value={salaryInput.hours} onChange={(event) => setSalaryInput({ ...salaryInput, hours: Number(event.target.value) })} /></label>
                <label>{t.workDays}<input type="number" value={salaryInput.days} onChange={(event) => setSalaryInput({ ...salaryInput, days: Number(event.target.value) })} /></label>
                <button className="secondary-button stretch" onClick={() => trackEvent('salary_calculated', 'salary', `${monthlyPay}`)} type="button">{t.calculate}</button>
              </Panel>
              <div className="pay-result"><Calculator size={32} /><span>{t.monthlyPay}</span><strong>{monthlyPay.toLocaleString()}원</strong></div>
            </div>
          </ScreenFrame>
        )}

        {screen === 'places' && (
          <LifeMapScreen
            t={t}
            profile={profile}
            placeFilters={placeFilters}
            setPlaceFilters={setPlaceFilters}
            placeRegionQuery={placeRegionQuery}
            setPlaceRegionQuery={setPlaceRegionQuery}
            placeLanguageFilter={placeLanguageFilter}
            setPlaceLanguageFilter={setPlaceLanguageFilter}
            filteredPlaces={filteredPlaces}
            selectedPlace={selectedPlace}
            setSelectedPlace={setSelectedPlace}
            onPlaceView={(place) => { trackEvent('place_viewed', 'places', place.name); go('placeDetail') }}
            onSave={togglePlaceSave}
            onSubmitPlace={submitPlaceReport}
          />
        )}

        {screen === 'places' && placeFilters.includes('__legacy__') && (
          <ScreenFrame title={t.placeMap} subtitle={t.mapReady}>
            <div className="filter-row">
              <select value={placeFilters[0] || 'all'} onChange={(event) => setPlaceFilters([event.target.value])} aria-label={t.filter}>
                <option value="all">{t.filter}: All</option>
                <option value="상담">상담</option>
                <option value="병원">병원</option>
                <option value="생활">생활</option>
              </select>
            </div>
            <div className="map-layout">
              <div className="mock-map" aria-label={t.mapReady}>
                <div className="map-watermark">{t.mapReady}</div>
                {filteredPlaces.map((place, index) => (
                  <button className={`map-marker marker-${index + 1}`} key={place.id} onClick={() => { setSelectedPlace(place); trackEvent('place_viewed', 'places', place.name); go('placeDetail') }} type="button" title={place.name}><MapPin size={18} /></button>
                ))}
              </div>
              <div className="card-list compact-list">
                {filteredPlaces.map((place) => (
                  <article className="data-card" key={place.id}>
                    <div className="card-head"><MapPin size={18} /><span>{place.category}</span><StatusPill label={statusLabel[place.approvalStatus]} /></div>
                    <h3>{place.name}</h3>
                    <p>{place.region}</p>
                    <button className="secondary-button stretch" onClick={() => { setSelectedPlace(place); trackEvent('place_viewed', 'places', place.name); go('placeDetail') }} type="button">{t.placeDetail}</button>
                  </article>
                ))}
              </div>
            </div>
            <form className="form-card" onSubmit={submitPlaceReport}>
              <h2>신규 장소 제보</h2>
              <div className="form-grid">
                <label>장소명<input name="name" required /></label>
                <label>카테고리<select name="category" defaultValue="병원"><option>병원</option><option>상담</option><option>생활</option><option>한국어교육</option></select></label>
                <label>지역<input name="region" defaultValue={profile.region} /></label>
                <label>전화<input name="phone" defaultValue="확인 필요" /></label>
              </div>
              <button className="secondary-button stretch" type="submit">장소 제보하기</button>
            </form>
          </ScreenFrame>
        )}

        {screen === 'placeDetail' && (
          <PlaceDetailScreen
            t={t}
            selectedPlace={selectedPlace}
            feeds={visibleFeeds}
            posts={visiblePosts}
            onBack={() => go('places')}
            onSave={() => togglePlaceSave(selectedPlace.id)}
            onReport={reportPlace}
            onFeed={() => go('daily')}
            onPost={(post) => { setSelectedPost(post); go('postDetail') }}
            onDirections={() => trackEvent('place_viewed', 'placeDetail', `directions:${selectedPlace.id}`)}
          />
        )}

        {screen === 'placeDetail' && selectedPlace.id < 0 && (
          <DetailFrame title={t.placeDetail} back={() => go('places')} backLabel={t.back}>
            <article className="detail-card">
              <p className="eyebrow">{selectedPlace.category}</p>
              <h2>{selectedPlace.name}</h2>
              <div className="metric-grid">
                <Metric label={t.region} value={selectedPlace.region} />
                <Metric label={t.phone} value={selectedPlace.phone} />
                <Metric label={t.hours} value={selectedPlace.hours} />
                <Metric label={t.languageSupport} value={selectedPlace.languages.join(', ')} />
              </div>
              <InfoBox icon={<CheckCircle2 size={18} />} text={`${t.source}: ${selectedPlace.source === 'operator' ? t.operator : t.userTip}`} />
              <Panel title={t.reviews}>
                {selectedPlace.reviews.length ? selectedPlace.reviews.map((review, index) => <ReviewLine key={review} review={review} index={index} />) : <p className="empty-text">No reviews yet</p>}
              </Panel>
              <button className="secondary-button stretch" onClick={() => trackEvent('place_viewed', 'placeDetail', `directions:${selectedPlace.id}`)} type="button"><MapPin size={18} />길찾기</button>
              <button className="primary-button stretch" onClick={() => togglePlaceSave(selectedPlace.id)} type="button"><Bookmark size={18} />{t.save}</button>
              <button className="secondary-button danger stretch" onClick={reportPlace} type="button"><Flag size={18} />장소 신고</button>
            </article>
          </DetailFrame>
        )}

        {screen === 'community' && (
          <ScreenFrame title={t.community} subtitle="가입 없이 공개 피드를 먼저 보고, 깊은 정보는 그룹에서 확인합니다.">
            {communityToast ? <div className="community-toast" role="status">{communityToast}</div> : null}
            <section className="community-summary-card">
              <div>
                <p className="eyebrow">맞춤 커뮤니티</p>
                <h2>{profile.region} · {profile.nationality === 'Vietnam' ? '베트남' : profile.nationality} · {profile.visa} 맞춤 정보</h2>
                <p>공개 피드는 바로 둘러볼 수 있고, 민감한 임금·비자·회사 정보는 안전한 그룹에서 더 깊게 나눕니다.</p>
              </div>
              <div className="community-summary-actions">
                <button className="primary-button" onClick={() => go('postCreate')} type="button"><Plus size={17} />글쓰기</button>
                <button className="secondary-button" onClick={() => go('communityGroups')} type="button"><UsersRound size={17} />그룹 보기</button>
              </div>
            </section>
            <SectionTitle title="추천 그룹" action="더 깊은 정보는 그룹에서" />
            <div className="community-group-rail" aria-label="추천 그룹">
              {communityHomeGroups.map((group) => (
                <CommunityGroupRailCard
                  key={group.id}
                  group={group}
                  membership={communityMemberships.find((membership) => membership.groupId === group.id && membership.userId === currentUserId)}
                  onOpen={() => openCommunityGroup(group)}
                />
              ))}
            </div>
            <CommunityIntentFilterBar
              filters={communityIntentFilters}
              selectedIds={selectedCommunityFilterIds}
              onToggle={toggleCommunityIntentFilter}
              onMore={() => setIsCommunityFilterSheetOpen(true)}
            />
            <SectionTitle title="맞춤 공개 피드" action={`${publicFeedPosts.length}개`} />
            <div className="card-list">
              {publicFeedPosts.length ? publicFeedPosts.slice(0, 8).map((post) => (
                <CommunityPostRow
                  key={post.id}
                  post={post}
                  group={communityGroups.find((group) => group.id === post.groupId)}
                  board={communityBoards.find((board) => board.id === post.boardId)}
                  variant={getCommunityPostVariant(post)}
                  translated={translatedPostIds.includes(post.id)}
                  onOpen={() => { setSelectedPost(post); go('postDetail') }}
                  onReport={() => reportCommunityPost(post)}
                  onBlock={() => blockPostAuthor(post)}
                  onTranslate={() => togglePostTranslation(post.id)}
                />
              )) : <EmptyState title="조건에 맞는 공개 피드가 없습니다." description="다른 필터를 선택하거나 추천 그룹을 둘러보세요." />}
            </div>
            <CommunitySafetyCard onHelp={() => go('help')} onReport={() => reportCommunityGroup(safetyCommunityGroup)} onSafetyRoom={() => openCommunityGroup(safetyCommunityGroup)} />
            <section className="community-translation-card">
              <Languages size={19} />
              <div>
                <strong>번역은 베타 mock입니다</strong>
                <p>한국어, 영어, 베트남어, 중국어, 우즈베크어 원문 언어를 표시하고, 번역 버튼으로 준비된 번역 또는 준비 중 안내를 보여줍니다.</p>
              </div>
            </section>
            <button className="secondary-button stretch subtle-action" onClick={() => setCommunityToast('그룹 만들기는 Phase 2에서 제공됩니다. 지금은 운영자 씨앗 그룹을 이용해주세요.')} type="button"><Plus size={18} />그룹 만들기 준비 중</button>
            <CommunityFilterSheet
              filters={communityIntentFilters}
              open={isCommunityFilterSheetOpen}
              selectedIds={selectedCommunityFilterIds}
              onToggle={toggleCommunityIntentFilter}
              onReset={resetCommunityIntentFilters}
              onClose={() => setIsCommunityFilterSheetOpen(false)}
            />
          </ScreenFrame>
        )}

        {screen === 'communityGroups' && (
          <DetailFrame title="그룹 목록" back={() => go('community')} backLabel={t.back}>
            <CommunityGroupFilters filters={communityFilters} onChange={updateCommunityFilter} groups={communityGroups} />
            <div className="result-summary">
              <strong>{filteredCommunityGroups.length}개 그룹</strong>
              <span>공개형은 즉시 가입, 승인형/조건형은 베타 mock 상태로 확인합니다.</span>
            </div>
            <div className="community-group-grid">
              {filteredCommunityGroups.length ? filteredCommunityGroups.map((group) => (
                <CommunityGroupCard
                  key={group.id}
                  group={group}
                  membership={communityMemberships.find((membership) => membership.groupId === group.id && membership.userId === currentUserId)}
                  onOpen={() => openCommunityGroup(group)}
                  onJoin={() => joinCommunityGroup(group)}
                />
              )) : <EmptyState title="조건에 맞는 그룹이 없습니다." description="필터를 줄이거나 새 그룹 만들기를 준비해주세요." />}
            </div>
            <button className="secondary-button stretch" onClick={() => logAction('그룹 만들기 요청', '커뮤니티', 'MVP mock: 생성 자격 확인 후 2차 개발')} type="button"><Plus size={18} />그룹 만들기</button>
          </DetailFrame>
        )}

        {screen === 'communityGroupDetail' && (
          <DetailFrame title="그룹 상세" back={() => go('community')} backLabel={t.back}>
            <CommunityGroupHero
              group={selectedCommunityGroup}
              membership={currentGroupMembership}
              policy={evaluateCommunityJoinPolicy({ group: selectedCommunityGroup, profile, user: users.find((user) => user.id === currentUserId) })}
              onJoin={() => joinCommunityGroup(selectedCommunityGroup)}
              onReport={() => reportCommunityGroup(selectedCommunityGroup)}
            />
            <div className="community-board-tabs">
              <button className={selectedBoardId === 'all' ? 'active' : ''} onClick={() => setSelectedBoardId('all')} type="button">전체</button>
              {selectedGroupBoards.map((board) => (
                <button className={selectedBoardId === board.id ? 'active' : ''} key={board.id} onClick={() => setSelectedBoardId(board.id)} type="button">{board.name}</button>
              ))}
            </div>
            <div className="button-row">
              <button className="primary-button grow" onClick={() => go('postCreate')} type="button"><Plus size={18} />게시글 쓰기</button>
              <button className="secondary-button grow" onClick={() => openLifeMap('상담기관')} type="button"><MapPin size={17} />상담기관 찾기</button>
            </div>
            <CommunitySafetyGuide />
            <div className="card-list">
              {selectedGroupPosts.length ? selectedGroupPosts.map((post) => (
                <CommunityPostRow
                  key={post.id}
                  post={post}
                  group={selectedCommunityGroup}
                  board={communityBoards.find((board) => board.id === post.boardId)}
                  onOpen={() => { setSelectedPost(post); go('postDetail') }}
                  onReport={() => reportCommunityPost(post)}
                  onBlock={() => blockPostAuthor(post)}
                />
              )) : <EmptyState title="아직 게시글이 없습니다." description="운영자 씨앗 콘텐츠 또는 첫 질문을 작성해 그룹을 시작해보세요." />}
            </div>
          </DetailFrame>
        )}

        {screen === 'postDetail' && (
          <DetailFrame title="" back={() => selectedPost.groupId ? go('communityGroupDetail') : go('community')} backLabel={t.back} showBack={false}>
            <CommunityPostDetailView
              post={selectedPost}
              board={selectedPostBoard}
              membership={selectedPostMembership}
              previousPost={selectedPostNavigation.previous}
              nextPost={selectedPostNavigation.next}
              popularPosts={popularDetailPosts}
              translated={translatedPostIds.includes(selectedPost.id)}
              helpCategory={detectedPostHelpCategory}
              onBackToCommunity={() => selectedPost.groupId ? go('communityGroupDetail') : go('community')}
              onJoinCommunity={() => selectedPostGroup ? joinCommunityGroup(selectedPostGroup) : undefined}
              onOpenPost={(post) => { setSelectedPost(post); go('postDetail') }}
              onTranslate={() => togglePostTranslation(selectedPost.id)}
              onComment={addPostComment}
              onReportPost={reportPost}
              onBlockAuthor={() => blockPostAuthor(selectedPost)}
              onToggleHidden={() => updatePost(selectedPost.id, { hidden: !selectedPost.hidden }, '게시글 숨김 전환')}
              onDelete={() => { updatePost(selectedPost.id, { deleted: true }, '게시글 삭제'); go('community') }}
              onHelp={() => {
                if (!detectedPostHelpCategory) return
                setSelectedHelpTypeId(detectedPostHelpCategory.id)
                go('help')
              }}
              onLifeMap={() => {
                if (!detectedPostHelpCategory) return
                openLifeMap(detectedPostHelpCategory.mapCategory)
              }}
              onReportComment={() => trackEvent('report_submitted', 'postDetail', `comment:${selectedPost.id}`)}
              onShare={() => {
                setCommunityToast('공유 기능은 베타 mock입니다.')
                logAction('게시글 공유', selectedPost.title, '베타 mock')
              }}
            />
          </DetailFrame>
        )}

        {screen === 'postCreate' && (
          <DetailFrame title={t.postCreate} back={() => go('communityGroupDetail')} backLabel={t.back}>
            <form className="form-card" onSubmit={submitPost}>
              <label>그룹<input value={selectedCommunityGroup.name} readOnly /></label>
              <label>게시판<select name="boardId" defaultValue={selectedBoardId === 'all' ? 'qna' : selectedBoardId}>
                {selectedGroupBoards.map((board) => <option key={board.id} value={board.id}>{board.name}</option>)}
              </select></label>
              <label>Title<input name="title" required /></label>
              <label>Category<select name="category" defaultValue="생활질문"><option>생활질문</option><option>노동정보</option><option>일자리후기</option></select></label>
              <label>{t.imageUpload}<input name="image" type="file" accept="image/*" /></label>
              <label>{t.content}<textarea name="body" rows={6} required /></label>
              <button className="primary-button stretch" type="submit">{t.writePost}</button>
            </form>
          </DetailFrame>
        )}

        {screen === 'help' && (
          <ScreenFrame title="도움요청 · 안전상담 허브" subtitle="상황을 선택하면 관련 정보, 기관 안내, 커뮤니티 안전방, 생활지도 연결을 함께 보여드립니다.">
            <section className="help-emergency-card">
              <div>
                <span className="safety-badge"><PhoneCall size={15} />긴급 안내</span>
                <h2>긴급한 상황인가요?</h2>
                <p>생명·신체 위험, 범죄, 사고는 WorkHere Korea가 아니라 즉시 112 또는 119에 신고하세요.</p>
                <small>WorkHere Korea는 긴급 신고를 대체하지 않습니다.</small>
              </div>
              <div className="button-row">
                <a className="primary-button danger-link" href="tel:112"><PhoneCall size={17} />112 연결</a>
                <a className="secondary-button danger" href="tel:119"><PhoneCall size={17} />119 연결</a>
              </div>
            </section>
            <section className="help-hero-card">
              <span className="safety-badge"><HeartHandshake size={15} />WorkHere Safety Hub</span>
              <h2>어떤 도움이 필요하세요?</h2>
              <p>기관명보다 “임금을 못 받았어요”, “비자가 곧 만료돼요”, “아파요”처럼 현재 상황으로 시작하세요.</p>
            </section>
            <div className="help-type-grid">
              {helpTypes.map((item) => (
                <button className={selectedHelpTypeId === item.id ? 'help-type-card active' : 'help-type-card'} key={item.id} onClick={() => { setSelectedHelpTypeId(item.id); setHelpSubmitMessage('') }} type="button">
                  <item.icon size={22} />
                  <strong>{item.title}</strong>
                  <span>{item.shortTitle}</span>
                </button>
              ))}
            </div>
            <div className="split-grid">
              <section className="help-detail-card">
                <div className="help-detail-head">
                  <selectedHelpType.icon size={24} />
                  <div>
                    <p className="eyebrow">도움 유형 상세</p>
                    <h2>{selectedHelpType.title}</h2>
                  </div>
                </div>
                <HelpDetailSection title="이런 경우에 해당합니다" items={selectedHelpType.applies} />
                <HelpDetailSection title="먼저 확인할 것" items={selectedHelpType.firstCheck} />
                <HelpDetailSection title="준비하면 좋은 정보" items={selectedHelpType.prepare} />
                <HelpDetailSection title="관련 정보글" items={selectedHelpType.relatedArticles} />
                <p className="help-guide-copy">WorkHere Korea는 공식 신고기관이 아닙니다. 긴급한 상황은 112 또는 119에 신고하고, 법률·체류·노동 관련 최종 판단은 해당 기관에 확인하세요.</p>
                {helpSubmitMessage ? <div className="mock-toast"><CheckCircle2 size={18} />{helpSubmitMessage}</div> : null}
                <div className="help-cta-layout" aria-label="도움요청 빠른 실행">
                  <button className="help-cta-card primary" onClick={submitQuickHelp} type="button" aria-label="도움요청하기">
                    <span className="help-cta-icon"><Send size={24} /></span>
                    <span className="help-cta-copy">
                      <strong>도움요청하기</strong>
                      <small>지금 필요한 도움을 선택하고 안내를 받아보세요.</small>
                    </span>
                  </button>
                  <div className="help-cta-secondary-grid">
                    <button className="help-cta-card secondary" onClick={() => openLifeMap(selectedHelpType.mapCategory)} type="button" aria-label="가까운 상담소 보기">
                      <span className="help-cta-icon"><MapPin size={21} /></span>
                      <span className="help-cta-copy">
                        <strong>가까운 상담소 보기</strong>
                        <small>주변 상담 기관과 지원센터를 찾아보세요.</small>
                      </span>
                    </button>
                    <button className="help-cta-card secondary" onClick={() => openCommunityGroup(safetyCommunityGroup)} type="button" aria-label="안전방에 질문하기">
                      <span className="help-cta-icon"><MessageCircle size={21} /></span>
                      <span className="help-cta-copy">
                        <strong>안전방에 질문하기</strong>
                        <small>비슷한 경험이 있는 사람들에게 질문해보세요.</small>
                      </span>
                    </button>
                  </div>
                </div>
              </section>
              <section className="help-detail-card">
                <div className="help-detail-head">
                  <Landmark size={24} />
                  <div>
                    <p className="eyebrow">연결 가능한 기관</p>
                    <h2>{selectedHelpInstitutions.length}개 안내</h2>
                  </div>
                </div>
                <div className="support-institution-list">
                  {selectedHelpInstitutions.map((institution) => <SupportInstitutionCard key={institution.id} institution={institution} />)}
                </div>
              </section>
            </div>
            <section className="safety-community-card">
              <div>
                <span className="safety-badge"><ShieldAlert size={15} />안전 커뮤니티</span>
                <h2>전국 임금체불·도움요청 안전방</h2>
                <p>{selectedHelpType.communityTag} 태그로 질문을 남길 수 있습니다. 민감한 문제는 개인정보를 제외하세요. 익명 글쓰기는 mock 상태입니다.</p>
              </div>
              <button className="secondary-button" onClick={() => openCommunityGroup(safetyCommunityGroup)} type="button"><MessageCircle size={17} />안전방 이동</button>
            </section>
            <div className="split-grid">
              <Panel title="Life Map 연결">
                <InfoLine icon={<MapPin size={16} />} text={`${selectedHelpType.mapCategory} 카테고리로 가까운 기관을 확인할 수 있습니다.`} />
                <button className="secondary-button stretch" onClick={() => openLifeMap(selectedHelpType.mapCategory)} type="button"><MapPin size={17} />Life Map에서 보기</button>
              </Panel>
              <Panel title={t.status}>
                {helpRequests.map((report) => <div className="report-row" key={report.id}><strong>{report.id}</strong><span>{report.type}</span><mark>{helpStatusLabel[report.status]}</mark></div>)}
              </Panel>
            </div>
            {isHelpRequestModalOpen ? (
              <HelpRequestModal
                category={selectedHelpType}
                language={language}
                profile={profile}
                onClose={() => setIsHelpRequestModalOpen(false)}
                onSubmit={submitHelpRequestModal}
              />
            ) : null}
          </ScreenFrame>
        )}

        {screen === 'mypage' && (
          <ScreenFrame title={t.myPage} subtitle={`${profile.nationality} · ${profile.region} · ${profile.visa}`}>
            <div className="split-grid">
              <Panel title="화면 설정">
                <button className="theme-toggle-card" onClick={() => setIsDarkMode((value) => !value)} type="button" aria-pressed={isDarkMode}>
                  <span className="theme-toggle-icon">{isDarkMode ? <Moon size={20} /> : <Sun size={20} />}</span>
                  <span className="theme-toggle-copy">
                    <strong>다크모드</strong>
                    <small>{isDarkMode ? '어두운 화면으로 보고 있습니다.' : '밝은 화면으로 보고 있습니다.'}</small>
                  </span>
                  <span className={isDarkMode ? 'theme-switch on' : 'theme-switch'} aria-hidden="true">
                    <span />
                  </span>
                </button>
              </Panel>
              <Panel title={t.profile}>
                <MyProfileSummary profile={profile} language={language} />
                <InfoLine icon={<UserRound size={16} />} text={profile.interests.join(', ')} />
                <InfoLine icon={<Globe2 size={16} />} text={languages.find((item) => item.code === language)?.native || language} />
                <button className="secondary-button stretch" onClick={() => go('admin')} type="button"><LayoutDashboard size={17} />{t.admin}</button>
              </Panel>
              <Panel title="프로필 업데이트"><button className="secondary-button stretch" onClick={() => trackEvent('profile_updated', 'mypage', `${profile.nationality}/${profile.region}`)} type="button"><UserRound size={17} />프로필 저장</button></Panel>
              <Panel title="커뮤니티">
                <InfoLine icon={<UsersRound size={16} />} text={`가입한 그룹 ${joinedGroups.length}개`} />
                {joinedGroups.length ? joinedGroups.map((group) => <ListButton key={group.id} title={group.name} meta={`${group.regionName} · ${group.memberCount.toLocaleString()}명`} onClick={() => openCommunityGroup(group)} />) : <p className="empty-text">가입한 그룹이 없습니다.</p>}
                <InfoLine icon={<MessageCircle size={16} />} text={`내가 쓴 글 ${visiblePosts.filter((post) => post.author === 'Me').length}개`} />
                <InfoLine icon={<Bookmark size={16} />} text={`관심글 ${visiblePosts.filter((post) => post.saved).length}개`} />
                <InfoLine icon={<Flag size={16} />} text={`도움요청/신고 내역 ${helpRequests.length + adminReports.filter((report) => report.reporter === 'Me').length}건 mock`} />
                <InfoLine icon={<Bell size={16} />} text="커뮤니티 알림 · 차단 목록 · 활동 뱃지는 Phase 2 예정" />
              </Panel>
              <Panel title={t.saved}>{jobs.filter((job) => job.saved).map((job) => <ListButton key={job.id} title={job.title} meta={job.region} onClick={() => { setSelectedJob(job); go('jobDetail') }} />)}{places.filter((place) => place.saved).map((place) => <ListButton key={place.id} title={place.name} meta={place.category} onClick={() => { setSelectedPlace(place); go('placeDetail') }} />)}{dailyFeeds.filter((feed) => feed.saved).map((feed) => <ListButton key={feed.id} title={feed.body} meta={feed.category} onClick={() => go('daily')} />)}</Panel>
              <Panel title={t.myPosts}>{visiblePosts.filter((post) => post.author === 'Me').length ? visiblePosts.filter((post) => post.author === 'Me').map((post) => <ListButton key={post.id} title={post.title} meta={post.category} onClick={() => { setSelectedPost(post); go('postDetail') }} />) : <p className="empty-text">작성한 글이 없습니다.</p>}</Panel>
              <BetaAccounts accounts={betaAccounts} />
            </div>
          </ScreenFrame>
        )}

        {screen === 'notifications' && (
          <ScreenFrame title="알림" subtitle="내 일상, 일자리, 커뮤니티, 도움요청 활동을 모아봅니다.">
            <section className="notification-summary">
              <div>
                <strong>오늘 확인할 알림</strong>
                <span>읽지 않은 활동 4개 · 처리 진행 2건</span>
              </div>
              <button className="secondary-button small" onClick={() => trackEvent('feed_viewed', 'notifications', 'mark_all_read')} type="button">모두 읽음</button>
            </section>
            <div className="notification-list">
              <NotificationActivity
                icon={<MessageCircle size={18} />}
                tone="community"
                title="전라북도 E-9·E-8 농업 근로자 커뮤니티에 새 댓글이 달렸습니다."
                body="E-8 계절근로 계약 기간 확인 질문에 계약서 확인 항목 댓글 2개가 추가됐습니다."
                meta="커뮤니티 · 방금 전"
                actionLabel="댓글 보기"
                onOpen={() => {
                  const group = communityGroups.find((item) => item.id === 'jeonbuk-e9-e8')
                  if (group) openCommunityGroup(group)
                }}
              />
              <NotificationActivity
                icon={<BriefcaseBusiness size={18} />}
                tone="job"
                title="내 비자 조건에 맞는 새 일자리 3건이 등록됐습니다."
                body={`${profile.visa} 기준으로 충북 음성, 전북 농업현장, 경남 김해 공고가 추천 목록에 추가됐습니다.`}
                meta="일자리 · 12분 전"
                actionLabel="일자리 보기"
                onOpen={() => go('jobs')}
              />
              <NotificationActivity
                icon={<Heart size={18} />}
                tone="daily"
                title="내 일상 피드에 좋아요와 댓글 반응이 생겼습니다."
                body="Tuan Nguyen님의 농장 출근길 피드에 좋아요 6개와 댓글 1개가 기록됐습니다."
                meta="일상 · 28분 전"
                actionLabel="내 피드 보기"
                onOpen={() => {
                  setDailyFilter('mine')
                  go('daily')
                }}
              />
              <NotificationActivity
                icon={<ShieldCheck size={18} />}
                tone="help"
                title="도움요청 접수 건이 상담기관 안내 단계로 변경됐습니다."
                body="임금·계약 관련 문의에 가까운 외국인근로자 지원기관 안내가 연결됐습니다."
                meta="도움요청 · 오늘 09:40"
                actionLabel="도움요청 보기"
                onOpen={() => go('help')}
              />
              <NotificationActivity
                icon={<MapPin size={18} />}
                tone="place"
                title="저장한 장소 근처에 다국어 상담 가능 기관이 추가됐습니다."
                body="경기 안산 생활지도에 한국어, English, Tiếng Việt 지원 장소가 업데이트됐습니다."
                meta="생활지도 · 어제"
                actionLabel="지도 보기"
                onOpen={() => go('places')}
              />
              <NotificationActivity
                icon={<Bell size={18} />}
                tone="notice"
                title="이번 주 공지: 급여명세서와 근무시간 기록을 확인하세요."
                body="월급일 전후로 시급, 공제 항목, 숙식비 차감 내역을 사진으로 보관하면 도움이 됩니다."
                meta="공지 · 2일 전"
                actionLabel="홈에서 보기"
                onOpen={() => go('home')}
              />
            </div>
          </ScreenFrame>
        )}

        {screen === 'admin' && (
          <ScreenFrame title="관리자 대시보드" subtitle="사용자 생성 콘텐츠와 신고/검수 프로세스를 운영합니다.">
            <div className="admin-stat-grid">
              <AdminTile icon={UsersRound} label="전체 회원 수" value={`${dashboard.totalUsers}`} onClick={() => go('adminUsers')} />
              <AdminTile icon={UserRound} label="오늘 가입자 수" value={`${dashboard.todayUsers}`} onClick={() => go('adminUsers')} />
              <AdminTile icon={Camera} label="전체 피드 수" value={`${dashboard.totalFeeds}`} onClick={() => go('adminFeeds')} />
              <AdminTile icon={Camera} label="오늘 작성 피드" value={`${dashboard.todayFeeds}`} onClick={() => go('adminFeeds')} />
              <AdminTile icon={MessageCircle} label="전체 커뮤니티 글" value={`${dashboard.totalPosts}`} onClick={() => go('adminPosts')} />
              <AdminTile icon={UsersRound} label="커뮤니티 그룹" value={`${communityGroups.length}`} onClick={() => go('adminGroups')} />
              <AdminTile icon={ShieldCheck} label="승인 대기 멤버" value={`${pendingGroupMemberships.length}`} onClick={() => go('adminGroupMembers')} />
              <AdminTile icon={MessageCircle} label="오늘 커뮤니티 글" value={`${dashboard.todayPosts}`} onClick={() => go('adminPosts')} />
              <AdminTile icon={MapPin} label="오늘 장소 조회" value={`${dashboard.todayPlaceViews}`} onClick={() => go('adminPlaces')} />
              <AdminTile icon={BriefcaseBusiness} label="오늘 일자리 조회" value={`${dashboard.todayJobViews}`} onClick={() => go('adminJobs')} />
              <AdminTile icon={Flag} label="미처리 신고" value={`${dashboard.openReports}`} onClick={() => go('adminReports')} />
              <AdminTile icon={CircleHelp} label="미처리 도움 요청" value={`${dashboard.openHelp}`} onClick={() => go('adminHelp')} />
              <AdminTile icon={MapPin} label="신규 장소 제보" value={`${dashboard.newPlaces}`} onClick={() => go('adminPlaces')} />
            </div>
            <div className="split-grid">
              <Panel title="운영 인사이트">
                <Metric label="인기 지역" value={dashboard.popularRegion} />
                <Metric label="인기 언어" value={dashboard.popularLanguage} />
                <Metric label="많이 조회된 장소" value={dashboard.topPlace} />
                <Metric label="많이 조회된 일자리" value={dashboard.topJob} />
              </Panel>
              <Panel title="운영정책">
                {policyNotices.map((notice) => <InfoLine key={notice} icon={<ShieldCheck size={16} />} text={notice} />)}
              </Panel>
              <AnalyticsPanel events={analyticsEvents} />
              <AdminLogs logs={adminLogs} />
            </div>
            <div className="split-grid">
              <QaScenarioPanel scenarios={qaScenarios} />
              <BetaAccounts accounts={betaAccounts} />
            </div>
            <div className="admin-grid">
              <AdminTile icon={Camera} label="피드 관리" value="검수" onClick={() => go('adminFeeds')} />
              <AdminTile icon={MessageCircle} label="커뮤니티 게시글 관리" value="게시글" onClick={() => go('adminPosts')} />
              <AdminTile icon={UsersRound} label="그룹 관리" value={`${communityGroups.length}`} onClick={() => go('adminGroups')} />
              <AdminTile icon={ShieldCheck} label="멤버 승인 관리" value={`${pendingGroupMemberships.length}`} onClick={() => go('adminGroupMembers')} />
              <AdminTile icon={MessageCircle} label="댓글 관리" value={`${comments.length}`} onClick={() => go('adminComments')} />
              <AdminTile icon={Flag} label="신고 관리" value={`${adminReports.length}`} onClick={() => go('adminReports')} />
              <AdminTile icon={CircleHelp} label="도움 요청 관리" value={`${helpRequests.length}`} onClick={() => go('adminHelp')} />
              <AdminTile icon={Map} label="장소 제보 승인" value={`${places.filter((place) => place.source === 'user').length}`} onClick={() => go('adminPlaces')} />
              <AdminTile icon={BriefcaseBusiness} label="일자리 관리" value={`${jobs.length}`} onClick={() => go('adminJobs')} />
              <AdminTile icon={UserX} label="회원 차단/경고" value={`${users.filter((user) => user.status !== 'active').length}`} onClick={() => go('adminUsers')} />
              <AdminTile icon={Bell} label="공지사항 관리" value={`${noticeRecords.length}`} onClick={() => go('adminNotices')} />
              <AdminTile icon={ImagePlus} label="배너 관리" value={`${banners.length}`} onClick={() => go('adminBanners')} />
              <AdminTile icon={CheckCircle2} label="QA 시나리오" value={`${qaScenarios.length}`} onClick={() => go('adminQA')} />
              <AdminTile icon={AlertTriangle} label="버그 리포트" value={`${bugReports.length}`} onClick={() => go('adminBugs')} />
            </div>
          </ScreenFrame>
        )}

        {screen === 'adminUsers' && (
          <AdminManage title="회원 차단/경고 관리" back={() => go('admin')}>
            {users.map((user) => (
              <div className="admin-row" key={user.id}>
                <ProfileIdentity user={user} fallback={{ displayName: user.name }} size="md" className="account-user-summary" />
                <small>{user.nationality} · {user.region} · {user.visa} · 경고 {user.warnings}회</small>
                <strong>{user.status}</strong>
                <button className="secondary-button small" onClick={() => warnUser(user.name)} type="button">경고</button>
                <button className="secondary-button small danger" onClick={() => blockUser(user.name)} type="button">차단</button>
              </div>
            ))}
            <AdminLogs logs={adminLogs} />
          </AdminManage>
        )}

        {screen === 'adminGroups' && (
          <AdminManage title="그룹 관리" back={() => go('admin')}>
            <InfoBox icon={<UsersRound size={18} />} text="그룹은 공개형, 승인형, 조건형 가입 정책과 안전 검수 상태를 함께 관리합니다. 조건형 검증은 communityAccessPolicy 기준으로 분리되어 있습니다." />
            {communityGroups.map((group) => (
              <div className={group.hidden ? 'admin-row hidden-row' : 'admin-row'} key={group.id}>
                <span>{group.hidden ? '[비공개] ' : ''}{group.name}</span>
                <small>{group.regionName} · {group.countryName} · {communityJoinModeLabel[group.joinMode]} · {group.memberCount.toLocaleString()}명 · {group.requiresCountryVerification ? '국적 인증 필요' : '인증 조건 없음'}</small>
                <strong>{group.reviewStatus ? statusLabel[group.reviewStatus] : group.isOfficialSeedGroup ? '운영자 추천' : '일반'}</strong>
                <button className="secondary-button small" onClick={() => updateCommunityGroup(group.id, { hidden: !group.hidden, moderationMemo: group.hidden ? '관리자 공개 처리' : '관리자 비공개 처리' }, '그룹 공개/비공개 처리')} type="button">{group.hidden ? '공개' : '비공개'}</button>
                <button className="secondary-button small" onClick={() => updateCommunityGroup(group.id, { isOfficialSeedGroup: !group.isOfficialSeedGroup, moderationMemo: '운영자 추천 상태 변경' }, '그룹 추천 상태 변경')} type="button">{group.isOfficialSeedGroup ? '추천 해제' : '운영자 추천'}</button>
                <button className="secondary-button small" onClick={() => updateCommunityGroup(group.id, { isSafetyFocused: !group.isSafetyFocused, moderationMemo: '안전방 상태 변경' }, '그룹 안전방 상태 변경')} type="button">{group.isSafetyFocused ? '안전방 해제' : '안전방 지정'}</button>
                {group.joinMode === 'conditional' ? <button className="secondary-button small" onClick={() => applyConditionalPolicyReview(group)} type="button">조건 검증</button> : null}
                <button className="secondary-button small danger" onClick={() => updateCommunityGroup(group.id, { hidden: true, reviewStatus: 'rejected', moderationMemo: '신고 또는 운영정책 위반으로 비노출' }, '그룹 삭제/비노출 처리')} type="button">삭제/비노출</button>
              </div>
            ))}
            <AdminLogs logs={adminLogs} />
          </AdminManage>
        )}

        {screen === 'adminGroupMembers' && (
          <AdminManage title="멤버 승인 관리" back={() => go('admin')}>
            <InfoBox icon={<ShieldCheck size={18} />} text="승인형 그룹의 가입 신청을 승인하거나 반려/차단합니다. 조건형 그룹은 프로필·국적 인증·비자 조건 검증 결과를 운영자에게 표시합니다." />
            {communityMemberships.map((membership) => {
              const group = communityGroups.find((item) => item.id === membership.groupId)
              const user = users.find((item) => item.id === membership.userId)
              const policy = group ? evaluateCommunityJoinPolicy({ group, profile: userToProfile(user), user }) : undefined
              return (
                <div className={membership.status === 'blocked' ? 'admin-row hidden-row' : 'admin-row'} key={`${membership.groupId}-${membership.userId}`}>
                  <span>{group?.name || membership.groupId}</span>
                  <small>{user?.name || membership.userId} · {user?.nationality || '-'} · {user?.region || '-'} · {user?.visa || '-'} · {policy?.allowed ? '조건 통과' : `부족: ${policy?.missingConditions.join(', ') || '-'}`}</small>
                  <strong>{communityMembershipStatusLabel[membership.status]} · {membership.role}</strong>
                  <button className="secondary-button small" onClick={() => updateCommunityMembership(membership.groupId, membership.userId, 'joined', 'member')} type="button">승인</button>
                  <button className="secondary-button small" onClick={() => updateCommunityMembership(membership.groupId, membership.userId, 'pending')} type="button">대기</button>
                  <button className="secondary-button small danger" onClick={() => updateCommunityMembership(membership.groupId, membership.userId, 'blocked')} type="button">차단</button>
                </div>
              )
            })}
            {pendingGroupMemberships.length === 0 ? <p className="empty-text">현재 승인 대기 멤버는 없습니다.</p> : null}
            <AdminLogs logs={adminLogs} />
          </AdminManage>
        )}

        {screen === 'adminFeeds' && (
          <AdminManage title="피드 관리" back={() => go('admin')}>
            {dailyFeeds.filter((feed) => !feed.deleted).map((feed) => (
              <article className="moderation-card" key={feed.id}>
                <img className="admin-thumb" src={assetUrl(feed.image)} alt="" loading="lazy" decoding="async" />
                <div>
                  <div className="card-head"><strong>{feed.author}</strong><span>{feed.nationality}</span><span>{feed.region}</span><mark>{feed.reported} 신고</mark></div>
                  <p>{feed.body}</p>
                  <div className="chip-row"><span className="chip">{feed.category}</span>{feed.hashtags.map((tag) => <span className="chip" key={tag}>{tag}</span>)}</div>
                  <div className="button-row">
                    <button className="secondary-button small" onClick={() => updateFeed(feed.id, { hidden: !feed.hidden }, '피드 공개/숨김 처리')} type="button">{feed.hidden ? '공개' : '숨김'}</button>
                    <button className="secondary-button small danger" onClick={() => updateFeed(feed.id, { deleted: true }, '피드 삭제')} type="button">삭제</button>
                    <button className="secondary-button small" onClick={() => warnUser(feed.author)} type="button">작성자 경고</button>
                    <button className="secondary-button small danger" onClick={() => blockUser(feed.author)} type="button">작성자 차단</button>
                  </div>
                </div>
              </article>
            ))}
          </AdminManage>
        )}

        {screen === 'adminPosts' && (
          <AdminManage title="커뮤니티 게시글 관리" back={() => go('admin')}>
            {posts.filter((post) => !post.deleted).map((post) => (
              <div className="admin-row" key={post.id}>
                <span>{post.hidden ? '[숨김] ' : ''}{post.title}</span>
                <small>{post.author} · {post.category} · {post.body}</small>
                <strong>{post.reported} 신고</strong>
                <button className="secondary-button small" onClick={() => updatePost(post.id, { hidden: !post.hidden }, '게시글 공개/숨김 처리')} type="button">{post.hidden ? '공개' : '숨김'}</button>
                <button className="secondary-button small danger" onClick={() => updatePost(post.id, { deleted: true }, '게시글 삭제')} type="button">삭제</button>
                <button className="secondary-button small" onClick={() => warnUser(post.author)} type="button">작성자 경고</button>
                <button className="secondary-button small danger" onClick={() => blockUser(post.author)} type="button">작성자 차단</button>
              </div>
            ))}
          </AdminManage>
        )}

        {screen === 'adminComments' && (
          <AdminManage title="댓글 관리" back={() => go('admin')}>
            {comments.map((comment) => (
              <div className="admin-row" key={comment.id}>
                <span>{comment.text}</span>
                <small>{comment.source} · {comment.parent}</small>
                <strong>검수 대상</strong>
                <button className="secondary-button small" onClick={() => logAction('댓글 숨김', comment.parent, comment.text)} type="button">숨김</button>
                <button className="secondary-button small danger" onClick={() => logAction('댓글 삭제', comment.parent, comment.text)} type="button">삭제</button>
              </div>
            ))}
          </AdminManage>
        )}

        {screen === 'adminReports' && (
          <AdminManage title="신고 관리" back={() => go('admin')}>
            {adminReports.map((report) => (
              <div className="admin-row" key={report.id}>
                <span>{report.reason}</span>
                <small>{report.targetType} #{report.targetId} · 신고자 {report.reporter} · {report.createdAt}</small>
                <strong>{reportStatusLabel[report.status]}</strong>
                <button className="secondary-button small" onClick={() => moderateReportedContent(report, 'keep')} type="button">유지</button>
                <button className="secondary-button small" onClick={() => moderateReportedContent(report, 'hide')} type="button">숨김</button>
                <button className="secondary-button small danger" onClick={() => moderateReportedContent(report, 'delete')} type="button">삭제</button>
                {(['reviewing', 'actioned', 'rejected', 'closed'] as ReportStatus[]).map((status) => (
                  <button className="secondary-button small" key={status} onClick={() => updateReportStatus(report.id, status)} type="button">{reportStatusLabel[status]}</button>
                ))}
              </div>
            ))}
          </AdminManage>
        )}

        {screen === 'adminHelp' && (
          <AdminManage title="도움 요청 관리" back={() => go('admin')}>
            <InfoBox icon={<CircleHelp size={18} />} text="도움 요청은 긴급 신고 대체가 아니라 관련 기관 안내와 기록 관리 중심으로 처리합니다." />
            {helpRequests.map((help) => (
              <div className="admin-row" key={help.id}>
                <span>{help.type}</span>
                <small>{help.content} {help.attachment ? `· 첨부 ${help.attachment}` : ''}</small>
                <strong>{helpStatusLabel[help.status]}</strong>
                {(['reviewing', 'agencyGuided', 'userAnswered', 'closed'] as HelpStatus[]).map((status) => (
                  <button className="secondary-button small" key={status} onClick={() => updateHelpStatus(help.id, status)} type="button">{helpStatusLabel[status]}</button>
                ))}
              </div>
            ))}
          </AdminManage>
        )}

        {screen === 'adminJobs' && (
          <AdminManage title="일자리 등록/수정/비공개 관리" back={() => go('admin')}>
            <form className="form-card" onSubmit={submitAdminJob}>
              <div className="form-grid">
                <label>공고명<input name="title" required /></label>
                <label>업체명<input name="company" required /></label>
                <label>지역<input name="region" defaultValue="경기 안산" /></label>
                <label>시급<input name="wage" type="number" defaultValue={10030} /></label>
              </div>
              <label>검수 메모<textarea name="description" rows={3} defaultValue="정보 제공용 일자리입니다. 직접 알선이 아닙니다." /></label>
              <button className="primary-button stretch" type="submit">일자리 등록</button>
            </form>
            {jobs.filter((job) => !job.deleted).map((job) => (
              <div className="admin-row" key={job.id}>
                <span>{job.hidden ? '[비공개] ' : ''}{job.title}</span>
                <small>{job.company} · {job.region} · {job.complianceNote}</small>
                <strong>{statusLabel[job.approvalStatus]}</strong>
                {job.approvalStatus !== 'approved' ? <button className="secondary-button small" onClick={() => approveJob(job.id)} type="button">승인</button> : null}
                <button className="secondary-button small" onClick={() => { setJobs(jobs.map((item) => item.id === job.id ? { ...item, complianceNote: '수정됨: 불법 알선 오해 표현 제거' } : item)); logAction('일자리 수정', job.title, '불법 알선 오해 표현 제거') }} type="button">수정</button>
                <button className="secondary-button small" onClick={() => { setJobs(jobs.map((item) => item.id === job.id ? { ...item, hidden: !item.hidden } : item)); logAction('일자리 비공개 전환', job.title, '목록 노출 상태 변경') }} type="button">{job.hidden ? '공개' : '비공개'}</button>
                <button className="secondary-button small danger" onClick={() => { setJobs(jobs.map((item) => item.id === job.id ? { ...item, deleted: true } : item)); logAction('일자리 삭제', job.title, '관리자 삭제') }} type="button">삭제</button>
              </div>
            ))}
          </AdminManage>
        )}

        {screen === 'adminPlaces' && (
          <AdminManage title="장소 제보 승인 관리" back={() => go('admin')}>
            {places.map((place) => (
              <div className="admin-row" key={place.id}>
                <span>{place.name}</span>
                <small>{place.source === 'user' ? '사용자 장소 제보' : '운영자 등록'} · {place.region} · {(place.reviewHistory || []).join(' / ')}</small>
                <strong>{statusLabel[place.approvalStatus]}</strong>
                {place.approvalStatus !== 'approved' ? <button className="secondary-button small" onClick={() => approvePlace(place.id)} type="button">승인</button> : null}
                <button className="secondary-button small danger" onClick={() => rejectPlace(place.id)} type="button">반려</button>
              </div>
            ))}
          </AdminManage>
        )}

        {screen === 'adminNotices' && (
          <AdminManage title="공지사항 관리" back={() => go('admin')}>
            {noticeRecords.map((notice) => (
              <div className="admin-row" key={notice.id}>
                <span>{notice.title}</span>
                <small>{notice.body}</small>
                <strong>{notice.published ? '노출' : '비노출'}</strong>
                <button
                  className="secondary-button small"
                  onClick={() => {
                    setNoticeRecords(noticeRecords.map((item) => (item.id === notice.id ? { ...item, published: !item.published } : item)))
                    logAction('공지사항 노출 변경', notice.title, notice.published ? '비노출' : '노출')
                  }}
                  type="button"
                >
                  {notice.published ? '비노출' : '노출'}
                </button>
                <button className="secondary-button small danger" onClick={() => logAction('공지사항 삭제 검토', notice.title, '삭제 전 이력 저장')} type="button">삭제</button>
              </div>
            ))}
          </AdminManage>
        )}

        {screen === 'adminBanners' && (
          <AdminManage title="배너 관리" back={() => go('admin')}>
            {banners.map((banner) => (
              <article className="moderation-card" key={banner.id}>
                <img className="admin-thumb" src={assetUrl(banner.image)} alt="" loading="lazy" decoding="async" />
                <div>
                  <div className="card-head"><strong>{banner.title}</strong><mark>{banner.published ? '노출' : '비노출'}</mark></div>
                  <p>{banner.body}</p>
                  <div className="button-row">
                    <button
                      className="secondary-button small"
                      onClick={() => {
                        setBanners(banners.map((item) => (item.id === banner.id ? { ...item, published: !item.published } : item)))
                        logAction('배너 노출 변경', banner.title, banner.published ? '비노출' : '노출')
                      }}
                      type="button"
                    >
                      {banner.published ? '비노출' : '노출'}
                    </button>
                    <button className="secondary-button small danger" onClick={() => logAction('배너 삭제 검토', banner.title, '삭제 전 이력 저장')} type="button">삭제</button>
                  </div>
                </div>
              </article>
            ))}
          </AdminManage>
        )}

        {screen === 'adminQA' && (
          <AdminManage title="QA 테스트 시나리오" back={() => go('admin')}>
            <PolicyNotice />
            <QaScenarioPanel scenarios={qaScenarios} />
            <Panel title="전체 메뉴 점검표">
              {[
                '홈 검색 및 빠른 메뉴 이동',
                '일상 피드 조회/작성/좋아요/댓글/저장/신고',
                '일자리 목록/상세/필터/급여계산기',
                '지도 장소 목록/상세/길찾기/저장',
                '커뮤니티 목록/상세/작성/댓글/신고',
                '도움요청 작성/접수/처리상태 확인',
                '마이페이지 내 글/저장목록/언어설정',
                '관리자 피드/게시글/댓글/장소/일자리/신고 관리',
              ].map((item) => <InfoLine key={item} icon={<CheckCircle2 size={16} />} text={item} />)}
            </Panel>
            <AnalyticsPanel events={analyticsEvents} />
          </AdminManage>
        )}

        {screen === 'adminBugs' && (
          <AdminManage title="버그 리포트" back={() => go('admin')}>
            <form className="form-card" onSubmit={submitBugReport}>
              <div className="form-grid">
                <label>화면명<input name="screenName" defaultValue="홈" required /></label>
                <label>문제 유형<input name="issueType" defaultValue="기능 오류" required /></label>
                <label>심각도<select name="severity" defaultValue="보통"><option>낮음</option><option>보통</option><option>높음</option><option>긴급</option></select></label>
                <label>재현 경로<input name="path" placeholder="예: 지도 > 병원 필터 > 상세" required /></label>
              </div>
              <label>문제 설명<textarea name="description" rows={4} required /></label>
              <label>담당자 메모<textarea name="ownerMemo" rows={3} defaultValue="담당자 배정 전" /></label>
              <button className="primary-button stretch" type="submit">버그 리포트 등록</button>
            </form>
            {bugReports.map((bug) => (
              <div className="admin-row" key={bug.id}>
                <span>{bug.screenName} · {bug.issueType}</span>
                  <small>{bug.path} · {bug.description} · {bug.ownerMemo} · 등록 {bug.createdAt} · 수정 {bug.updatedAt}</small>
                <strong>{bug.severity} / {bug.status}</strong>
                {(['확인 중', '수정 완료', '보류'] as BugReport['status'][]).map((status) => (
                  <button className="secondary-button small" key={status} onClick={() => setBugReports(bugReports.map((item) => (item.id === bug.id ? { ...item, status, updatedAt: '2026-05-29' } : item)))} type="button">{status}</button>
                ))}
              </div>
            ))}
          </AdminManage>
        )}
      </main>

      {showShell ? (
        <nav className={isBottomNavCompact ? 'bottom-tabs compact' : 'bottom-tabs'} aria-label="Bottom tabs">
          {mainTabs.map((item) => (
            <TabButton key={item.screen} item={item} active={isTabActive(screen, item.screen)} onClick={() => go(item.screen)} />
          ))}
        </nav>
      ) : null}
    </div>
  )
}

function filterDailyFeeds(feeds: DailyFeed[], filter: string, profile: UserProfile, currentUserId: number) {
  if (filter === 'mine') return feeds.filter((feed) => feed.authorId === currentUserId)
  if (filter === 'nationality') return feeds.filter((feed) => feed.nationality === profile.nationality)
  if (filter === 'region' || filter === 'nearby') return feeds.filter((feed) => feed.region.includes(profile.region.split(' ').at(-1) || profile.region))
  if (filter === 'popular') return [...feeds].sort((a, b) => b.likes - a.likes)
  return feeds
}

function matchesJobRegion(job: Job, selectedRegionCodes: string[]) {
  if (!selectedRegionCodes.length) return true
  return selectedRegionCodes.some((code) => (
    code === job.regionCode
    || code === job.cityCode
    || code === job.districtCode
    || job.region.includes(flattenJobRegions(jobRegions).find((region) => region.code === code)?.name || code)
  ))
}

function getBestJobVisaMatch(job: Job, visaTypes: VisaType[]) {
  const targets = visaTypes.length ? visaTypes : (['UNKNOWN'] as VisaType[])
  return targets
    .map((visaType) => getVisaJobMatch(job, visaType))
    .sort((a, b) => a.rank - b.rank)[0]
}

function profileScore(item: { region?: string; nationality?: string; languages?: Language[]; likes?: number }, profile: UserProfile) {
  const regionKeyword = profile.region.split(' ').at(-1) || profile.region
  let score = 0
  if (item.region?.includes(regionKeyword)) score += 400
  if (item.nationality === profile.nationality) score += 300
  if (item.languages?.includes('vi') && profile.nationality === 'Vietnam') score += 200
  score += item.likes ?? 0
  return score
}

function rankByProfile<T extends { region?: string; nationality?: string; languages?: Language[]; likes?: number }>(items: T[], profile: UserProfile) {
  return [...items].sort((a, b) => profileScore(b, profile) - profileScore(a, profile))
}

function rankPosts(posts: Post[], profile: UserProfile) {
  return [...posts].sort((a, b) => {
    const aScore = (a.category.includes('질문') || a.category.includes('Q&A') ? 300 : 0) + a.comments.length * 30 - a.reported * 20 + (a.body.includes(profile.region.split(' ').at(-1) || profile.region) ? 200 : 0)
    const bScore = (b.category.includes('질문') || b.category.includes('Q&A') ? 300 : 0) + b.comments.length * 30 - b.reported * 20 + (b.body.includes(profile.region.split(' ').at(-1) || profile.region) ? 200 : 0)
    return bScore - aScore
  })
}

function rankCommunityFeedPosts(posts: Post[], groups: CommunityGroup[], profile: UserProfile, currentLanguage: Language) {
  return [...posts].sort((a, b) => {
    const aScore = communityPostScore(a, groups, profile, currentLanguage)
    const bScore = communityPostScore(b, groups, profile, currentLanguage)
    return bScore - aScore
  })
}

function communityPostScore(post: Post, groups: CommunityGroup[], profile: UserProfile, currentLanguage: Language) {
  const group = groups.find((item) => item.id === post.groupId)
  const regionKeyword = profile.region.split(' ').at(-1) || profile.region
  const profileCountry = profileCountryCode(profile)
  let score = 0
  if (group?.regionName === profile.region || group?.regionName.includes(regionKeyword) || post.body.includes(regionKeyword)) score += 400
  if (group?.countryCode === profileCountry || post.countryCode === profileCountry) score += 300
  if (group?.languageCode === currentLanguage || post.languageCode === currentLanguage) score += 180
  if (group?.visaTypes.includes(profile.visa) || post.body.includes(profile.visa)) score += 160
  if (post.isSafetyReport) score += 80
  if (post.category.includes('질문') || post.category.includes('도움')) score += 60
  score += (post.likeCount || 0) * 3 + (post.commentCount || post.comments.length) * 8 + (post.viewCount || 0) / 20
  return score - post.reported * 12
}

function filterCommunityFeedPosts(posts: Post[], selectedFilterIds: string[], groups: CommunityGroup[]) {
  const activeFilterIds = selectedFilterIds.includes('all') ? [] : selectedFilterIds
  if (!activeFilterIds.length) return posts
  return posts.filter((post) => activeFilterIds.some((filterId) => communityPostMatchesIntent(post, filterId, groups)))
}

function communityPostMatchesIntent(post: Post, filterId: string, groups: CommunityGroup[]) {
  const group = groups.find((item) => item.id === post.groupId)
  const text = `${post.title} ${post.category} ${post.body} ${group?.name || ''} ${group?.description || ''} ${post.boardId || ''}`
  if (filterId === 'question') return text.includes('질문') || text.includes('qna')
  if (filterId === 'life') return text.includes('생활') || text.includes('병원') || text.includes('통신') || text.includes('마트') || text.includes('정보')
  if (filterId === 'company-review') return text.includes('회사') || text.includes('기숙사') || text.includes('후기') || text.includes('workplace')
  if (filterId === 'help') return post.isSafetyReport || text.includes('도움') || text.includes('임금') || text.includes('사기') || text.includes('help') || text.includes('safety')
  if (filterId === 'daily') return text.includes('일상') || text.includes('쉬는날') || text.includes('맛집') || post.images.length > 0
  if (filterId === 'trade') return text.includes('중고') || text.includes('거래')
  if (filterId === 'visa') return text.includes('비자') || text.includes('체류') || text.includes('외국인등록')
  if (filterId === 'wage') return text.includes('임금') || text.includes('급여') || text.includes('노동') || text.includes('근로계약')
  if (filterId === 'medical') return text.includes('병원') || text.includes('의료') || text.includes('건강보험') || text.includes('통역')
  if (filterId === 'dorm') return text.includes('기숙사') || text.includes('숙소') || text.includes('공제')
  if (filterId === 'local') return text.includes('지역') || text.includes('소식') || text.includes(group?.regionName || '')
  if (filterId === 'meeting') return text.includes('모임') || text.includes('친구') || text.includes('커뮤니티')
  if (filterId === 'share') return text.includes('나눔') || text.includes('무료') || text.includes('도움')
  if (filterId === 'notice') return post.isNotice || text.includes('공지') || text.includes('안전')
  if (filterId === 'free') return text.includes('자유') || text.includes('공개')
  return true
}

function getCommunityPostVariant(post: Post): CommunityPostVariant {
  const text = `${post.title} ${post.category} ${post.body} ${post.boardId || ''}`
  if (post.isNotice || text.includes('공지')) return 'notice'
  if (text.includes('중고') || text.includes('거래') || text.includes('나눔')) return 'trade'
  if (text.includes('일상') || text.includes('쉬는날') || text.includes('맛집') || post.images.length > 0) return 'album'
  if (post.isSafetyReport || text.includes('질문') || text.includes('도움') || text.includes('임금') || text.includes('비자') || text.includes('qna') || text.includes('help')) return 'qa'
  return 'list'
}

function profileCountryCode(profile: UserProfile) {
  if (profile.nationality === 'Vietnam' || profile.nationality === '베트남') return 'VN'
  if (profile.nationality === 'China' || profile.nationality === '중국') return 'CN'
  if (profile.nationality === 'Uzbekistan' || profile.nationality === '우즈베키스탄') return 'UZ'
  if (profile.nationality === 'Thailand' || profile.nationality === '태국') return 'TH'
  return 'ALL'
}

function buildCommentRows(posts: Post[], feeds: DailyFeed[]) {
  return [
    ...posts.flatMap((post) => post.comments.map((comment, index) => ({ id: `post-${post.id}-${index}`, source: '커뮤니티', parent: post.title, text: comment }))),
    ...feeds.flatMap((feed) => feed.comments.map((comment, index) => ({ id: `feed-${feed.id}-${index}`, source: '일상 피드', parent: feed.body.slice(0, 24), text: comment }))),
  ]
}

function hasDangerKeyword(feed: DailyFeed) {
  return dangerWords.some((word) => feed.body.includes(word) || feed.hashtags.some((tag) => tag.includes(word)))
}

function mostFrequent(values: string[]) {
  const counts = values.reduce<Record<string, number>>((acc, value) => {
    acc[value] = (acc[value] || 0) + 1
    return acc
  }, {})
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || '-'
}

function topEventDetail(events: AnalyticsEvent[], name: AnalyticsEventName) {
  const values = events.filter((event) => event.name === name).map((event) => event.detail).filter(Boolean)
  return mostFrequent(values) || '-'
}

function toggleId(ids: number[], id: number) {
  return ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]
}

function isTabActive(screen: Screen, tab: Screen) {
  const groups: Partial<Record<Screen, Screen[]>> = {
    daily: ['daily', 'dailyCreate'],
    jobs: ['jobs', 'jobDetail', 'salary'],
    places: ['places', 'placeDetail'],
    community: ['community', 'communityGroups', 'communityGroupDetail', 'postDetail', 'postCreate', 'help'],
  }
  return screen === tab || Boolean(groups[tab]?.includes(screen))
}

function getHeaderBackScreen(screen: Screen, selectedPost?: Post): Screen {
  const fallbackMap: Partial<Record<Screen, Screen>> = {
    dailyCreate: 'daily',
    jobDetail: 'jobs',
    salary: 'jobs',
    placeDetail: 'places',
    communityGroups: 'community',
    communityGroupDetail: 'community',
    postDetail: selectedPost?.groupId ? 'communityGroupDetail' : 'community',
    postCreate: 'communityGroupDetail',
    help: 'home',
    notifications: 'home',
    mypage: 'home',
    admin: 'home',
    adminUsers: 'admin',
    adminFeeds: 'admin',
    adminPosts: 'admin',
    adminComments: 'admin',
    adminJobs: 'admin',
    adminPlaces: 'admin',
    adminReports: 'admin',
    adminHelp: 'admin',
    adminNotices: 'admin',
    adminBanners: 'admin',
    adminGroups: 'admin',
    adminGroupMembers: 'admin',
    adminQA: 'admin',
    adminBugs: 'admin',
  }
  return fallbackMap[screen] || 'home'
}

function getHeaderContextLabel(screen: Screen) {
  const labels: Partial<Record<Screen, string>> = {
    daily: '일상',
    dailyCreate: '일상 작성',
    jobs: '일자리',
    jobDetail: '일자리 상세',
    salary: '급여계산기',
    places: '지도',
    placeDetail: '장소 상세',
    community: '커뮤니티',
    communityGroups: '그룹 목록',
    communityGroupDetail: '그룹 상세',
    postDetail: '커뮤니티',
    postCreate: '글쓰기',
    help: '도움요청',
    notifications: '알림',
    mypage: '마이페이지',
    admin: '관리자',
  }
  return labels[screen] || '뒤로'
}

function filterCommunityGroups(groups: CommunityGroup[], filters: Record<string, string>) {
  return groups
    .filter((group) => filters.region === 'all' || group.regionName === filters.region || (filters.region === '전국' && group.regionName === '전국'))
    .filter((group) => filters.country === 'all' || group.countryCode === filters.country || group.countryCode === 'ALL')
    .filter((group) => filters.language === 'all' || group.languageCode === filters.language || group.languageName === '다국어')
    .filter((group) => filters.visa === 'all' || group.visaTypes.includes(filters.visa))
    .filter((group) => filters.joinMode === 'all' || group.joinMode === filters.joinMode)
    .filter((group) => filters.verification === 'all' || (filters.verification === 'required' ? group.requiresCountryVerification : !group.requiresCountryVerification))
}

function rankCommunityGroups(groups: CommunityGroup[], profile: UserProfile) {
  return [...groups].sort((a, b) => communityGroupScore(b, profile) - communityGroupScore(a, profile))
}

function communityGroupScore(group: CommunityGroup, profile: UserProfile) {
  let score = group.isOfficialSeedGroup ? 8 : 0
  if (group.regionName === profile.region) score += 20
  if (group.countryName === profile.nationality || group.countryCode === 'ALL') score += 12
  if (group.visaTypes.includes(profile.visa)) score += 8
  if (group.isSafetyFocused) score += 6
  return score + Math.min(group.memberCount / 100, 8)
}

function countryFlag(countryCode: string) {
  if (countryCode === 'VN') return '🇻🇳'
  if (countryCode === 'CN') return '🇨🇳'
  if (countryCode === 'UZ') return '🇺🇿'
  return '🌐'
}

function supportInstitutionsForCategory(category: HelpCategoryView, institutions: SupportInstitution[]) {
  const issueTypes = new Set(category.issueTypes)
  return institutions.filter((institution) => institution.issueTypes.some((type) => issueTypes.has(type))).slice(0, 4)
}

function detectHelpCategoryFromText(text: string, categories: HelpCategoryView[]) {
  const rules: Array<{ id: string; keywords: string[] }> = [
    { id: 'wage', keywords: ['월급', '임금', '돈 못 받음', '퇴직금', '최저임금'] },
    { id: 'visa', keywords: ['비자', '체류', '외국인등록', '출입국'] },
    { id: 'industrial_accident', keywords: ['다쳤', '산재', '부상', '병원', '치료'] },
    { id: 'medical', keywords: ['아파', '건강보험', '의료통역', '진료'] },
    { id: 'housing', keywords: ['기숙사', '숙소', '퇴거', '숙소비'] },
    { id: 'fraud', keywords: ['사기', '보증금', '소개비', '여권 보관', '가짜'] },
    { id: 'discrimination', keywords: ['차별', '폭언', '성희롱', '괴롭힘'] },
  ]
  const matched = rules.find((rule) => rule.keywords.some((keyword) => text.includes(keyword)))
  return matched ? categories.find((category) => category.id === matched.id) : undefined
}

function userToProfile(user?: User): UserProfile {
  return {
    nationality: user?.nationality || 'Vietnam',
    region: user?.region || '경기 안산',
    visa: user?.visa || 'E-9',
    interests: ['커뮤니티'],
  }
}

function Topbar({
  language,
  setLanguage,
  t,
  go,
  screen,
  onBack,
  onSearch,
}: {
  language: Language
  setLanguage: (value: Language) => void
  t: Record<string, string>
  go: (screen: Screen) => void
  screen: Screen
  onBack: () => void
  onSearch: (keyword: string) => void
}) {
  const isHome = screen === 'home'
  return (
    <header className={isHome ? 'topbar' : 'topbar subpage'}>
      <div className="topbar-main">
        {isHome ? (
          <button className="topbar-brand" onClick={() => go('home')} type="button" aria-label={`${t.appName} 홈`}>
            <img src={workhereLogo} alt={t.appName} />
          </button>
        ) : (
          <button className="topbar-back-button" onClick={onBack} type="button" aria-label="뒤로 가기">
            <ChevronLeft size={24} />
            <span>{getHeaderContextLabel(screen)}</span>
          </button>
        )}
        <div className="topbar-actions" aria-label="빠른 메뉴">
          <button className="icon-button notification-button has-unread" onClick={() => go('notifications')} type="button" title={t.notifications} aria-label={`${t.notifications} 읽지 않은 알림 있음`}>
            <Bell size={18} />
            <span className="notification-dot" aria-hidden="true" />
          </button>
          <button className="icon-button" onClick={() => go('mypage')} type="button" title={t.myPage} aria-label={t.myPage}><UserRound size={18} /></button>
          <button className="icon-button help-action" onClick={() => go('help')} type="button" title="도움요청" aria-label="도움요청"><HelpRequestIcon size={21} /></button>
          <select className="language-select" value={language} onChange={(event) => setLanguage(event.target.value as Language)} aria-label={t.selectLanguage}>
            {languages.map((item) => <option key={item.code} value={item.code}>{item.native}</option>)}
          </select>
        </div>
      </div>
      <form
        className="topbar-search"
        onSubmit={(event) => {
          event.preventDefault()
          const form = new FormData(event.currentTarget)
          onSearch(String(form.get('keyword') || ''))
        }}
      >
        <Search size={17} />
        <input name="keyword" placeholder={t.searchPlaceholder} aria-label={t.searchPlaceholder} />
      </form>
    </header>
  )
}

function HeroSection({ t, onStart }: { t: Record<string, string>; onStart: () => void }) {
  const features = [
    { icon: Camera, label: 'Daily life', tone: 'mint', position: 'top' },
    { icon: MapPin, label: 'Life map', tone: 'blue', position: 'middle' },
    { icon: HelpRequestIcon, label: 'Help record', tone: 'navy', position: 'bottom' },
  ]

  return (
    <section className="splash">
      <div className="splash-copy">
        <HeroBadge />
        <img className="splash-logo" src={workhereLogo} alt={t.appName} />
        <p>{t.splashLine}</p>
        <HeroCTA label={t.start} onClick={onStart} />
      </div>
      <HeroFeatureList features={features} onFeatureClick={onStart} />
    </section>
  )
}

function HeroBadge() {
  return <p className="hero-badge">WorkHere Korea Beta</p>
}

function HeroCTA({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button className="primary-button hero-cta" onClick={onClick} type="button">
      {label}
      <ChevronRight size={18} />
    </button>
  )
}

function HeroFeatureList({
  features,
  onFeatureClick,
}: {
  features: Array<{ icon: AppIcon; label: string; tone: string; position: string }>
  onFeatureClick: () => void
}) {
  return (
    <div className="splash-device" aria-label="WorkHere Korea key features">
      {features.map((feature) => (
        <HeroFeaturePoint key={feature.label} {...feature} onClick={onFeatureClick} />
      ))}
    </div>
  )
}

function HeroFeaturePoint({
  icon: Icon,
  label,
  tone,
  position,
  onClick,
}: {
  icon: AppIcon
  label: string
  tone: string
  position: string
  onClick: () => void
}) {
  return (
    <button className={`hero-feature-point ${position} ${tone}`} onClick={onClick} type="button">
      <span><Icon size={18} /></span>
      <strong>{label}</strong>
    </button>
  )
}

function PolicyNotice({ compact = false, items = policyNotices }: { compact?: boolean; items?: string[] }) {
  const visibleItems = compact ? items.slice(0, 3) : items
  return (
    <section className={compact ? 'policy-box compact' : 'policy-box'}>
      {visibleItems.map((notice) => <InfoLine key={notice} icon={<AlertTriangle size={16} />} text={notice} />)}
    </section>
  )
}

function QaScenarioPanel({ scenarios }: { scenarios: QaScenario[] }) {
  return (
    <Panel title="베타 테스트 시나리오">
      {scenarios.map((scenario) => (
        <div className="qa-row" key={scenario.id}>
          <strong>{scenario.title}</strong>
          <small>{scenario.path}</small>
          <span>{scenario.expected}</span>
          <mark>{scenario.status === 'ready' ? '테스트 준비' : scenario.status}</mark>
        </div>
      ))}
    </Panel>
  )
}

function BetaAccounts({ accounts }: { accounts: BetaAccount[] }) {
  return (
    <Panel title="베타 테스트 계정">
      {accounts.map((account) => (
        <div className="account-row" key={account.email}>
          <ProfileIdentity user={getSampleUserForName(account.role)} fallback={{ displayName: account.role }} size="md" className="account-user-summary" />
          <small>{account.email} / {account.password}</small>
          <span>{account.profile} · 언어 {account.language} · 관심 {account.interests}</span>
          <em>{account.memo}</em>
        </div>
      ))}
    </Panel>
  )
}

function MyProfileSummary({ profile, language }: { profile: UserProfile; language: Language }) {
  const identity = mergeProfileUser(
    { displayName: profile.nationality ? `${profile.nationality} 사용자` : 'WorkHere 사용자' },
    getSampleUserById(1),
  )
  return (
    <div className="my-profile-summary">
      <ProfileAvatar {...identity} size="lg" />
      <div>
        <strong>{identity.displayName}</strong>
        <span className={`profile-status ${profileStatusLabel(identity) === '미인증' ? 'unverified' : 'verified'}`}>{profileStatusLabel(identity)}</span>
        <span>{profile.region} · {profile.visa} · {languages.find((item) => item.code === language)?.native || language}</span>
      </div>
    </div>
  )
}

function AnalyticsPanel({ events }: { events: AnalyticsEvent[] }) {
  const counts = events.reduce<Record<string, number>>((acc, event) => {
    acc[event.name] = (acc[event.name] || 0) + 1
    return acc
  }, {})
  const eventNames: AnalyticsEventName[] = [
    'sign_up_completed',
    'onboarding_completed',
    'language_selected',
    'feed_viewed',
    'feed_created',
    'feed_liked',
    'feed_commented',
    'feed_saved',
    'post_created',
    'post_commented',
    'place_viewed',
    'place_saved',
    'place_reported',
    'job_viewed',
    'job_saved',
    'salary_calculated',
    'help_report_submitted',
    'report_submitted',
    'search_performed',
    'profile_updated',
  ]
  return (
    <Panel title="분석 이벤트">
      <div className="event-grid">
        {eventNames.map((name) => <Metric key={name} label={name} value={`${counts[name] || 0}`} />)}
      </div>
      {events.slice(0, 5).map((event) => (
        <InfoLine key={event.id} icon={<CheckCircle2 size={16} />} text={`${event.name} · ${event.screen} · ${event.detail || '-'}`} />
      ))}
    </Panel>
  )
}

function LifeMapScreen({
  t,
  profile,
  placeFilters,
  setPlaceFilters,
  placeRegionQuery,
  setPlaceRegionQuery,
  placeLanguageFilter,
  setPlaceLanguageFilter,
  filteredPlaces,
  setSelectedPlace,
  onPlaceView,
  onSave,
  onSubmitPlace,
}: {
  t: Record<string, string>
  profile: UserProfile
  placeFilters: string[]
  setPlaceFilters: (value: string[] | ((current: string[]) => string[])) => void
  placeRegionQuery: string
  setPlaceRegionQuery: (value: string) => void
  placeLanguageFilter: 'all' | Language
  setPlaceLanguageFilter: (value: 'all' | Language) => void
  filteredPlaces: Place[]
  selectedPlace: Place
  setSelectedPlace: (place: Place) => void
  onPlaceView: (place: Place) => void
  onSave: (placeId: number) => void
  onSubmitPlace: (event: React.FormEvent<HTMLFormElement>) => void
}) {
  const [activePlace, setActivePlace] = useState<Place | undefined>(undefined)
  const [mapSearch, setMapSearch] = useState('')
  const [showRegionSheet, setShowRegionSheet] = useState(false)
  const [showLocationPermission, setShowLocationPermission] = useState(false)
  const [isSheetExpanded, setIsSheetExpanded] = useState(false)
  const [locationNotice, setLocationNotice] = useState('현재 위치를 허용하면 가까운 병원, 약국, 상담기관을 더 쉽게 찾을 수 있습니다.')
  const effectiveRegion = placeRegionQuery || profile.region
  const placeRegionSearchTerm = effectiveRegion === '충북 오창' ? '충북 청주' : effectiveRegion
  const regionPlaces = filteredPlaces.filter((place) => `${place.region} ${place.address}`.includes(placeRegionSearchTerm))
  const searchedPlaces = regionPlaces.filter((place) => {
    const keyword = mapSearch.trim()
    if (!keyword) return true
    return `${place.name} ${place.category} ${place.services?.join(' ')}`.includes(keyword)
  })
  const currentActivePlace = activePlace && searchedPlaces.some((place) => place.id === activePlace.id)
    ? activePlace
    : undefined
  const selectedFilterLabel = placeFilters.length === 0
    ? '선택 없음'
    : placeFilters.length === 1
      ? placeFilters[0]
      : `${placeFilters.length}개 유형`
  const resultLabel = `${selectedFilterLabel} ${searchedPlaces.length}곳`

  const requestLocation = () => {
    setShowLocationPermission(true)
  }

  const applyLocationPermission = (mode: 'whileUsing' | 'once' | 'denied') => {
    setShowLocationPermission(false)
    if (mode === 'denied') {
      setLocationNotice('위치 권한이 없어 선택한 지역 기준으로 장소를 보여드립니다.')
      return
    }
    setPlaceRegionQuery(profile.region)
    setActivePlace(undefined)
    setLocationNotice(mode === 'whileUsing'
      ? '앱을 사용하는 동안 현재 위치 기준으로 주변 장소를 보여드립니다.'
      : '이번 한 번만 현재 위치 기준으로 주변 장소를 보여드립니다.')
  }

  const selectPlace = (place: Place) => {
    setActivePlace(place)
    setSelectedPlace(place)
    setIsSheetExpanded(false)
  }

  const selectRegion = (region: string) => {
    setPlaceRegionQuery(region)
    setLocationNotice(`${region} 기준으로 지도 마커와 장소 목록을 다시 보여드립니다.`)
    setShowRegionSheet(false)
    setActivePlace(undefined)
  }

  return (
    <ScreenFrame title="내 주변 생활도움 지도" subtitle="병원, 약국, 상담기관, 송금, 통신 장소를 지역별로 찾아보세요.">
      <section className="life-map-page">
        <div className="life-map-controls">
          <RegionFilter region={effectiveRegion} onOpen={() => setShowRegionSheet(true)} onLocate={requestLocation} />
          <div className="topbar-search life-map-search">
            <Search size={17} />
            <input value={mapSearch} onChange={(event) => setMapSearch(event.target.value)} placeholder="병원, 약국, 상담기관 검색" aria-label="생활도움 장소 검색" />
          </div>
          <label>언어 지원<select value={placeLanguageFilter} onChange={(event) => setPlaceLanguageFilter(event.target.value as 'all' | Language)}>{languageFilterOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
        </div>
        <InfoLine icon={<CircleHelp size={16} />} text={locationNotice} />
      </section>
      <CategoryTabs selected={placeFilters} resultLabel={resultLabel} onSelect={(value) => {
        setPlaceFilters((current) => togglePlaceFilter(current, value))
        setActivePlace(undefined)
      }} />
      <div className="life-map-workspace">
        <MapPanel
          places={searchedPlaces}
          activePlace={currentActivePlace}
          region={effectiveRegion}
          onOpenRegion={() => setShowRegionSheet(true)}
          onSelect={selectPlace}
          onLocate={requestLocation}
          onSave={(place) => onSave(place.id)}
        />
        <PlaceList
          places={searchedPlaces}
          activePlace={currentActivePlace}
          onSelect={selectPlace}
          onDetail={(place) => { setSelectedPlace(place); onPlaceView(place) }}
          onSave={(place) => onSave(place.id)}
          t={t}
        />
      </div>
      {currentActivePlace ? (
        <PlaceBottomSheet
          place={currentActivePlace}
          expanded={isSheetExpanded}
          setExpanded={setIsSheetExpanded}
          onClose={() => setActivePlace(undefined)}
          onDetail={() => onPlaceView(currentActivePlace)}
          onSave={() => onSave(currentActivePlace.id)}
          t={t}
        />
      ) : null}
      {showRegionSheet ? <RegionSheet current={effectiveRegion} onSelect={selectRegion} onClose={() => setShowRegionSheet(false)} /> : null}
      {showLocationPermission ? <LocationPermissionModal onSelect={applyLocationPermission} onClose={() => setShowLocationPermission(false)} /> : null}
      <form className="form-card life-map-report-form" onSubmit={onSubmitPlace}>
        <h2>신규 장소 제보</h2>
        <p className="empty-text">사용자가 제보한 장소는 관리자 검수 후 지도에 노출됩니다.</p>
        <div className="form-grid">
          <label>장소명<input name="name" required /></label>
          <label>카테고리<select name="category" defaultValue="병원">{lifeMapCategories.map((category) => <option key={category}>{category}</option>)}</select></label>
          <label>지역<input name="region" defaultValue={profile.region} /></label>
          <label>전화<input name="phone" defaultValue="확인 필요" /></label>
        </div>
        <button className="secondary-button stretch" type="submit">장소 제보하기</button>
      </form>
    </ScreenFrame>
  )
}

function RegionFilter({ region, onOpen, onLocate }: { region: string; onOpen: () => void; onLocate: () => void }) {
  return (
    <div className="region-filter">
      <button className="region-select-button" type="button" onClick={onOpen} aria-label="지역 선택">
        <MapPin size={17} />
        <span>{region}</span>
        <ChevronRight size={15} />
      </button>
      <button className="current-location-button" type="button" onClick={onLocate}>
        현재 위치
      </button>
    </div>
  )
}

function togglePlaceFilter(current: string[], value: string) {
  if (value === 'all') {
    return current.length === lifeMapCategories.length ? [] : [...lifeMapCategories]
  }
  if (current.includes(value)) {
    return current.filter((item) => item !== value)
  }
  return [...current, value]
}

function CategoryTabs({ selected, resultLabel, onSelect }: { selected: string[]; resultLabel: string; onSelect: (value: string) => void }) {
  const tabs = ['all', ...lifeMapCategories]
  const allSelected = selected.length === lifeMapCategories.length
  return (
    <section className="category-tabs" aria-label="장소 유형 필터">
      <div className="category-tabs-header">
        <strong>유형별 보기</strong>
        <span>{resultLabel}</span>
      </div>
      <div className="category-chip-scroll">
        {tabs.map((tab) => {
          const active = tab === 'all' ? allSelected : selected.includes(tab)
          return (
            <button className={`category-chip ${active ? 'active' : ''}`} key={tab} type="button" onClick={() => onSelect(tab)} aria-pressed={active}>
              {tab === 'all' ? '전체' : tab}
            </button>
          )
        })}
      </div>
    </section>
  )
}

function MapPanel({ places, activePlace, region, onOpenRegion, onSelect, onLocate, onSave }: { places: Place[]; activePlace?: Place; region: string; onOpenRegion: () => void; onSelect: (place: Place) => void; onLocate: () => void; onSave: (place: Place) => void }) {
  return (
    <section className="map-panel" aria-label="생활도움 지도">
      <div className="map-toolbar">
        <button className="map-region-label" type="button" onClick={onOpenRegion}><MapPin size={14} />{region}</button>
        <button className="map-floating-button" type="button" onClick={onLocate}><MapPin size={16} />현재 위치</button>
      </div>
      <LifeMapView places={places} activePlace={activePlace} region={region} onSelect={onSelect} onLocate={onLocate} onSave={onSave} />
    </section>
  )
}

function PlaceBottomSheet({ place, expanded, setExpanded, onClose, onDetail, onSave, t }: { place: Place; expanded: boolean; setExpanded: (value: boolean) => void; onClose: () => void; onDetail: () => void; onSave: () => void; t: Record<string, string> }) {
  return (
    <aside className={`place-bottom-sheet ${expanded ? 'expanded' : ''}`} aria-label="선택 장소 요약">
      <button className="sheet-handle-button" type="button" onClick={() => setExpanded(!expanded)} aria-label={expanded ? '장소 정보 접기' : '장소 정보 펼치기'}>
        <span />
      </button>
      <div className="sheet-header">
        <div>
          <div className="place-card-badges">
            <span className={`category-badge ${categoryClass(place.category)}`}>{place.category}</span>
            <span className={place.isOpen ? 'status-badge success' : 'status-badge warning'}>{place.isOpen ? '영업 중' : '확인 필요'}</span>
          </div>
          <h3>{place.name}</h3>
          <p>{place.region} · {place.distanceKm?.toFixed(1) || '-'}km · {languageLabels(place.languages)}</p>
        </div>
        <button className="icon-button" type="button" onClick={onClose} aria-label="닫기">×</button>
      </div>
      <div className="tag-list">
        {(place.services || []).slice(0, 3).map((service) => <span key={service}>#{service}</span>)}
      </div>
      {expanded ? (
        <div className="sheet-expanded-content">
          <p><strong>주소</strong>{place.address}</p>
          <p><strong>운영시간</strong>{place.hours}</p>
          <p><strong>후기</strong>{place.reviews[0] || '아직 등록된 후기가 없습니다.'}</p>
        </div>
      ) : null}
      <div className="sheet-actions">
        <a className="secondary-button mini" href={`tel:${place.phone}`}>전화하기</a>
        <a
          className="secondary-button mini"
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.name} ${place.address}`)}`}
          rel="noreferrer"
          target="_blank"
        >
          길찾기
        </a>
        <button className="secondary-button mini" type="button" onClick={onSave}><Bookmark size={14} />{t.save}</button>
        <button className="primary-button mini" type="button" onClick={onDetail}>상세보기</button>
      </div>
    </aside>
  )
}

function PlaceList({ places, activePlace, onSelect, onDetail, onSave, t }: { places: Place[]; activePlace?: Place; onSelect: (place: Place) => void; onDetail: (place: Place) => void; onSave: (place: Place) => void; t: Record<string, string> }) {
  return (
    <section className="place-list-section">
      <div className="place-list-header">
        <div>
          <strong>조건에 맞는 장소</strong>
          <span>{places.length}곳이 표시됩니다</span>
        </div>
        <button className="secondary-button mini" type="button">장소 제보</button>
      </div>
      {places.length ? (
        <div className="place-card-list">
          {places.map((place) => (
            <PlaceCard
              active={activePlace?.id === place.id}
              key={place.id}
              place={place}
              onDetail={() => onDetail(place)}
              onSave={() => onSave(place)}
              onSelect={() => onSelect(place)}
              t={t}
            />
          ))}
        </div>
      ) : (
        <EmptyState title="이 지역에는 아직 등록된 장소가 없습니다." description="새로운 장소를 제보하면 관리자 검수 후 지도에 반영됩니다." actionLabel="장소 제보하기" />
      )}
    </section>
  )
}

function PlaceCard({ place, active, onSelect, onDetail, onSave, t }: { place: Place; active: boolean; onSelect: () => void; onDetail: () => void; onSave: () => void; t: Record<string, string> }) {
  return (
    <article className={`place-card ${active ? 'active' : ''}`} onClick={onSelect}>
      <div className="place-card-badges">
        <span className={`category-badge ${categoryClass(place.category)}`}>{place.category}</span>
        <span className={place.isOpen ? 'status-badge success' : 'status-badge warning'}>{place.isOpen ? '영업 중' : '확인 필요'}</span>
      </div>
      <h3>{place.name}</h3>
      <p>{place.region} · {place.distanceKm?.toFixed(1) || '-'}km</p>
      <p>지원 언어: {languageLabels(place.languages)}</p>
      <div className="tag-list">
        {(place.services || []).slice(0, 3).map((service) => <span key={service}>#{service}</span>)}
      </div>
      <div className="place-card-actions">
        <a className="secondary-button mini" href={`tel:${place.phone}`} onClick={(event) => event.stopPropagation()}>전화하기</a>
        <button className="secondary-button mini" type="button" onClick={(event) => { event.stopPropagation(); onDetail() }}>길찾기</button>
        <button className="secondary-button mini" type="button" onClick={(event) => { event.stopPropagation(); onSave() }}>{t.save}</button>
        <button className="primary-button mini" type="button" onClick={(event) => { event.stopPropagation(); onDetail() }}>상세보기</button>
      </div>
    </article>
  )
}

function RegionSheet({ current, onSelect, onClose }: { current: string; onSelect: (region: string) => void; onClose: () => void }) {
  const currentRegion = regionOptions.find((region) => region.value === current)
  return createPortal(
    <div className="region-sheet-backdrop" role="presentation" onClick={onClose}>
      <section className="region-sheet" role="dialog" aria-modal="true" aria-label="지역 선택" onClick={(event) => event.stopPropagation()}>
        <div className="sheet-header">
          <div>
            <p className="eyebrow">지역 필터</p>
            <h3>어느 지역의 도움 장소를 볼까요?</h3>
            <p className="region-sheet-copy">지역을 선택하면 지도 마커와 장소 목록이 해당 권역 기준으로 바뀝니다.</p>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="닫기">×</button>
        </div>
        <div className="region-sheet-preview">
          <MapPin size={17} />
          <div>
            <strong>{currentRegion ? `${currentRegion.region1} ${currentRegion.region2}` : current}</strong>
            <span>병원, 약국, 상담기관, 송금, 행정기관을 먼저 보여줍니다.</span>
          </div>
        </div>
        <div className="region-list" aria-label="지역 목록">
          {regionOptions.map((region) => (
            <button className={`region-option ${current === region.value ? 'active' : ''}`} key={region.value} type="button" onClick={() => onSelect(region.value)}>
              <span className="region-option-pin"><MapPin size={15} /></span>
              <span className="region-option-copy">
                <strong>{region.region1} {region.region2}</strong>
                <small>{region.value === '충북 오창' ? '오창읍 주변 샘플 지도' : '지역 기준 장소 보기'}</small>
              </span>
              <ChevronRight size={15} />
            </button>
          ))}
        </div>
      </section>
    </div>,
    document.body,
  )
}

function LocationPermissionModal({ onSelect, onClose }: { onSelect: (mode: 'whileUsing' | 'once' | 'denied') => void; onClose: () => void }) {
  return createPortal(
    <div className="location-permission-backdrop" role="presentation" onClick={onClose}>
      <section className="location-permission-modal" role="dialog" aria-modal="true" aria-label="위치 권한 선택" onClick={(event) => event.stopPropagation()}>
        <div className="location-permission-icon"><MapPin size={24} /></div>
        <h3>WorkHere Korea에서 현재 위치를 사용하도록 허용할까요?</h3>
        <p>가까운 병원, 약국, 상담기관과 행정기관을 현재 위치 기준으로 보여드립니다.</p>
        <div className="location-permission-actions">
          <button className="primary-button" type="button" onClick={() => onSelect('whileUsing')}>앱을 사용하는 동안 허용</button>
          <button className="secondary-button" type="button" onClick={() => onSelect('once')}>한 번 허용</button>
          <button className="ghost-button" type="button" onClick={() => onSelect('denied')}>허용 안 함</button>
        </div>
      </section>
    </div>,
    document.body,
  )
}

function EmptyState({ title, description, actionLabel }: { title: string; description: string; actionLabel?: string }) {
  return (
    <div className="empty-state-card">
      <MapPin size={22} />
      <strong>{title}</strong>
      <p>{description}</p>
      {actionLabel ? <button className="secondary-button mini" type="button">{actionLabel}</button> : null}
    </div>
  )
}

function PlaceDetailScreen({ t, selectedPlace, feeds, posts, onBack, onSave, onReport, onFeed, onPost, onDirections }: { t: Record<string, string>; selectedPlace: Place; feeds: DailyFeed[]; posts: Post[]; onBack: () => void; onSave: () => void; onReport: () => void; onFeed: () => void; onPost: (post: Post) => void; onDirections: () => void }) {
  const relatedFeeds = feeds.filter((feed) => selectedPlace.linkedFeedIds?.includes(feed.id) || feed.placeId === selectedPlace.id).slice(0, 3)
  const relatedPosts = posts.filter((post) => selectedPlace.linkedPostIds?.includes(post.id) || post.body.includes(selectedPlace.category) || post.title.includes(selectedPlace.category)).slice(0, 3)

  return (
    <DetailFrame title={t.placeDetail} back={onBack} backLabel={t.back}>
      <div className="detail-content-stack place-detail-card">
        <article className="detail-card detail-section-card">
          <p className="eyebrow">{selectedPlace.category}</p>
          <h2>{selectedPlace.name}</h2>
          <div className="metric-grid">
            <Metric label="거리" value={`${selectedPlace.distanceKm || '-'}km`} />
            <Metric label={t.region} value={selectedPlace.region} />
            <Metric label={t.phone} value={selectedPlace.phone} />
            <Metric label={t.hours} value={selectedPlace.hours} />
            <Metric label={t.languageSupport} value={languageLabels(selectedPlace.languages)} />
            <Metric label="외국인 이용" value={selectedPlace.foreignerFriendly ? '가능' : '확인 필요'} />
          </div>
          <InfoBox icon={<CheckCircle2 size={18} />} text={`${t.address}: ${selectedPlace.address}`} />
          <InfoBox icon={<ShieldCheck size={18} />} text={`${t.source}: ${selectedPlace.source === 'operator' ? t.operator : t.userTip} · ${selectedPlace.isOpen ? '현재 영업 중' : '방문 전 확인 필요'}`} />
        </article>
        <Panel title="제공 서비스"><div className="chip-row">{(selectedPlace.services || []).map((service) => <span className="chip" key={service}>{service}</span>)}</div></Panel>
        <Panel title={t.reviews}>{selectedPlace.reviews.length ? selectedPlace.reviews.map((review, index) => <ReviewLine key={review} review={review} index={index} />) : <p className="empty-text">No reviews yet</p>}</Panel>
        <Panel title="관련 일상 피드">{relatedFeeds.length ? relatedFeeds.map((feed) => <ListButton key={feed.id} title={feed.body} meta={`${feed.author} · ${feed.region}`} onClick={onFeed} />) : <p className="empty-text">연결된 피드가 아직 없습니다.</p>}</Panel>
        <Panel title="관련 커뮤니티 질문">{relatedPosts.length ? relatedPosts.map((post) => <ListButton key={post.id} title={post.title} meta={`${post.category} · ${post.comments.length} 댓글`} onClick={() => onPost(post)} />) : <p className="empty-text">가까운 병원/상담기관 질문을 커뮤니티에서 연결할 수 있습니다.</p>}</Panel>
        <section className="detail-action-card">
          <div className="button-row">
            <button className="secondary-button grow" onClick={onDirections} type="button"><MapPin size={18} />길찾기</button>
            <a className="secondary-button grow" href={`tel:${selectedPlace.phone}`}><Bell size={18} />전화하기</a>
            <button className="primary-button grow" onClick={onSave} type="button"><Bookmark size={18} />{t.save}</button>
          </div>
          <button className="secondary-button danger stretch" onClick={onReport} type="button"><Flag size={18} />정보 수정 요청 / 신고</button>
        </section>
      </div>
    </DetailFrame>
  )
}

function languageLabels(values: Language[]) {
  return values.map((value) => languages.find((item) => item.code === value)?.native || value).join(', ')
}

function profileForAuthor(author: string, authorId?: number, fallback?: ProfileUser): ProfileUser {
  return mergeProfileUser(fallback, getSampleUserById(authorId) || getSampleUserForName(author))
}

function categoryClass(category: string) {
  if (category.includes('병원')) return 'medical'
  if (category.includes('약국')) return 'pharmacy'
  if (category.includes('상담')) return 'support'
  if (category.includes('송금')) return 'money'
  if (category.includes('통신')) return 'phone'
  if (category.includes('음식')) return 'food'
  if (category.includes('행정')) return 'admin'
  if (category.includes('안전') || category.includes('산재')) return 'safety'
  return 'community'
}

export function DailyFeedCard({
  feed,
  t,
  translated,
  place,
  job,
  onTranslate,
  onLike,
  onComment,
  onSave,
  onReport,
  onHide,
  onPlace,
  onJob,
  onHelp,
  onQuestion,
}: {
  feed: DailyFeed
  t: Record<string, string>
  translated: boolean
  place?: Place
  job?: Job
  onTranslate: () => void
  onLike: () => void
  onComment: () => void
  onSave: () => void
  onReport: () => void
  onHide: () => void
  onPlace: () => void
  onJob: () => void
  onHelp: () => void
  onQuestion: () => void
}) {
  return (
    <article className="daily-card">
      <img src={assetUrl(feed.image)} alt={`${feed.author} daily life`} loading="lazy" decoding="async" />
      <div className="daily-body">
        <div className="daily-meta">
          <strong>{feed.author}</strong>
          <span>{feed.nationality}</span>
          <span>{feed.region}</span>
          <span>{feed.createdAt}</span>
          <mark>{visibilityLabel(feed.visibility, t)}</mark>
        </div>
        <p>{translated ? feed.translatedBody : feed.body}</p>
        <div className="chip-row">
          <span className="chip">{feed.category}</span>
          {feed.hashtags.map((tag) => <span className="chip" key={tag}>{tag}</span>)}
        </div>
        <div className="button-row">
          {place ? <button className="secondary-button small" onClick={onPlace} type="button"><MapPin size={16} />{place.name}</button> : null}
          {job ? <button className="secondary-button small" onClick={onJob} type="button"><BriefcaseBusiness size={16} />{t.linkedJob}</button> : null}
          {hasDangerKeyword(feed) ? <button className="secondary-button small danger" onClick={onHelp} type="button"><AlertTriangle size={16} />{t.askHelp}</button> : null}
          {feed.category === '질문' ? <button className="secondary-button small" onClick={onQuestion} type="button"><MessageCircle size={16} />{t.shareQuestion}</button> : null}
        </div>
        <div className="daily-actions">
          <button onClick={onLike} type="button"><Heart size={17} />{feed.likes}</button>
          <button onClick={onComment} type="button"><MessageCircle size={17} />{feed.comments.length}</button>
          <button onClick={onTranslate} type="button"><Languages size={17} />{t.translate}</button>
          <button onClick={onSave} type="button"><Bookmark size={17} fill={feed.saved ? 'currentColor' : 'none'} />{t.save}</button>
          <button onClick={onReport} type="button"><Flag size={17} />{t.report}</button>
          <button onClick={onHide} type="button"><MoreHorizontal size={17} />{t.hide}</button>
        </div>
      </div>
    </article>
  )
}

function DailyFeedCardV2({
  feed,
  t,
  translated,
  place,
  job,
  onTranslate,
  onLike,
  onComment,
  onSave,
  onReport,
  onHide,
  onPlace,
  onJob,
  onHelp,
  onQuestion,
}: {
  feed: DailyFeed
  t: Record<string, string>
  translated: boolean
  place?: Place
  job?: Job
  onTranslate: () => void
  onLike: () => void
  onComment: () => void
  onSave: () => void
  onReport: () => void
  onHide: () => void
  onPlace: () => void
  onJob: () => void
  onHelp: () => void
  onQuestion: () => void
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <article className="daily-card feed-card">
      <FeedHeader feed={feed} t={t} onReport={onReport} onHide={onHide} />
      <FeedCarousel feed={feed} />
      <FeedActions feed={feed} t={t} onLike={onLike} onComment={onComment} onSave={onSave} />
      <FeedCaption
        feed={feed}
        t={t}
        translated={translated}
        expanded={expanded}
        setExpanded={setExpanded}
        onTranslate={onTranslate}
        place={place}
        job={job}
        onPlace={onPlace}
        onJob={onJob}
        onHelp={onHelp}
        onQuestion={onQuestion}
      />
    </article>
  )
}

function CommunitySafetyCard({ onHelp, onReport, onSafetyRoom }: { onHelp: () => void; onReport: () => void; onSafetyRoom: () => void }) {
  return (
    <section className="community-safety-card">
      <div>
        <span className="safety-badge"><ShieldAlert size={15} />사기·허위 일자리 주의</span>
        <h2>도움이 필요할 때 바로 연결하세요.</h2>
        <p>임금체불, 여권 보관, 수수료 요구는 기록하고 안전방 또는 도움요청으로 이어갈 수 있습니다. 긴급 위험은 112/119가 우선입니다.</p>
      </div>
      <div className="community-safety-actions">
        <button className="primary-button community-safety-action" onClick={onSafetyRoom} type="button"><ShieldAlert size={17} /><span>안전방</span></button>
        <button className="secondary-button community-safety-action" onClick={onHelp} type="button"><HelpRequestIcon size={18} /><span>도움요청</span></button>
        <button className="secondary-button danger community-safety-action" onClick={onReport} type="button"><Flag size={17} /><span>신고</span></button>
      </div>
    </section>
  )
}

function NotificationActivity({
  icon,
  tone,
  title,
  body,
  meta,
  actionLabel,
  onOpen,
}: {
  icon: ReactNode
  tone: 'community' | 'job' | 'daily' | 'help' | 'place' | 'notice'
  title: string
  body: string
  meta: string
  actionLabel: string
  onOpen: () => void
}) {
  return (
    <article className={`notification-card ${tone}`}>
      <span className="notification-icon">{icon}</span>
      <div className="notification-copy">
        <div className="notification-meta">{meta}</div>
        <strong>{title}</strong>
        <p>{body}</p>
      </div>
      <button className="secondary-button small" onClick={onOpen} type="button">{actionLabel}</button>
    </article>
  )
}

function CommunityGroupCard({ group, membership, onOpen, onJoin }: { group: CommunityGroup; membership?: CommunityMembership; onOpen: () => void; onJoin: () => void }) {
  const joined = membership?.status === 'joined'
  const pending = membership?.status === 'pending'
  const isVisaVerifiedGroup = group.id === 'jeonbuk-e9-e8'
  return (
    <article className={group.isSafetyFocused ? 'community-group-card safety' : 'community-group-card'}>
      <button className="community-group-cover" onClick={onOpen} type="button">
        {group.groupImageUrl ? <img src={assetUrl(group.groupImageUrl)} alt="" loading="lazy" decoding="async" /> : <span>{countryFlag(group.countryCode)}</span>}
        <div className="community-group-badges">
          {group.isOfficialSeedGroup ? <mark>운영자 추천</mark> : null}
          {group.isSafetyFocused ? <mark className="danger">안전방</mark> : null}
          {isVisaVerifiedGroup ? <mark>비자 인증</mark> : null}
          {group.joinMode === 'conditional' ? <mark>조건 필요</mark> : null}
        </div>
      </button>
      <div className="community-group-body">
        <div className="community-group-title">
          <span>{countryFlag(group.countryCode)}</span>
          <h3>{group.name}</h3>
        </div>
        <p>{group.description}</p>
        <div className="community-group-meta">
          <span>{group.regionName}</span>
          <span>{group.languageName}</span>
          <span>{communityJoinModeLabel[group.joinMode]}</span>
          {group.requiresCountryVerification ? <span>국적 인증 필요</span> : null}
        </div>
        <div className="community-group-stats">
          <strong>{group.memberCount.toLocaleString()}명</strong>
          <span>{group.postCount.toLocaleString()}글</span>
          {membership ? <mark>{communityMembershipStatusLabel[membership.status]}</mark> : null}
        </div>
        <div className="button-row">
          <button className="secondary-button grow" onClick={onOpen} type="button">상세보기</button>
          <button className="primary-button grow" disabled={joined || pending} onClick={onJoin} type="button">
            {joined ? '가입됨' : pending ? '신청 완료' : group.joinMode === 'approval' ? '가입 신청' : '가입하기'}
          </button>
        </div>
      </div>
    </article>
  )
}

function CommunityGroupRailCard({ group, membership, onOpen }: { group: CommunityGroup; membership?: CommunityMembership; onOpen: () => void }) {
  return (
    <button className={group.isSafetyFocused ? 'community-group-rail-card safety' : 'community-group-rail-card'} onClick={onOpen} type="button">
      <span className="community-group-rail-cover">
        {group.groupImageUrl ? <img src={assetUrl(group.groupImageUrl)} alt="" loading="lazy" decoding="async" /> : <span>{countryFlag(group.countryCode)}</span>}
      </span>
      <span className="community-group-rail-copy">
        <strong>{group.name.replace('경기 ', '').replace('전국 ', '')}</strong>
        <small>{group.regionName} · {group.languageName} · {group.memberCount.toLocaleString()}명</small>
        <span>{membership?.status === 'joined' ? '가입됨' : group.isSafetyFocused ? '안전방' : communityJoinModeLabel[group.joinMode]}</span>
      </span>
    </button>
  )
}

function CommunityIntentFilterBar({
  filters,
  selectedIds,
  onToggle,
  onMore,
}: {
  filters: CommunityIntentFilter[]
  selectedIds: string[]
  onToggle: (filterId: string) => void
  onMore: () => void
}) {
  const primaryFilters = filters.filter((filter) => filter.isPrimary)
  const selectedSecondaryFilters = filters.filter((filter) => !filter.isPrimary && selectedIds.includes(filter.id))
  const extraCount = selectedSecondaryFilters.length
  return (
    <div className="community-intent-filter-bar" role="tablist" aria-label="공개 피드 의도 필터">
      {primaryFilters.map((filter) => (
        <button
          className={selectedIds.includes(filter.id) ? 'active' : ''}
          key={filter.id}
          onClick={() => onToggle(filter.id)}
          type="button"
          aria-pressed={selectedIds.includes(filter.id)}
        >
          {filter.label}
        </button>
      ))}
      {selectedSecondaryFilters.map((filter) => (
        <button
          className="active selected-extra"
          key={filter.id}
          onClick={() => onToggle(filter.id)}
          type="button"
          aria-label={`${filter.label} 필터 제거`}
          aria-pressed
        >
          {filter.label}<span aria-hidden="true">×</span>
        </button>
      ))}
      <button
        className={extraCount ? 'more active' : 'more'}
        onClick={onMore}
        type="button"
        aria-label="필터 더보기"
      >
        ...
        {extraCount ? <mark>{extraCount}</mark> : null}
      </button>
    </div>
  )
}

function CommunityFilterSheet({
  filters,
  open,
  selectedIds,
  onToggle,
  onReset,
  onClose,
}: {
  filters: CommunityIntentFilter[]
  open: boolean
  selectedIds: string[]
  onToggle: (filterId: string) => void
  onReset: () => void
  onClose: () => void
}) {
  if (!open) return null
  const secondaryFilters = filters.filter((filter) => !filter.isPrimary)
  return createPortal(
    <div className="community-filter-sheet-overlay" role="presentation" onMouseDown={onClose}>
      <section
        className="community-filter-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="community-filter-sheet-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="sheet-handle" aria-hidden="true" />
        <div className="community-filter-sheet-header">
          <div>
            <h2 id="community-filter-sheet-title">필터 더보기</h2>
            <p>보고 싶은 글 유형을 선택하세요.</p>
          </div>
          <button className="icon-button" onClick={onClose} type="button" aria-label="필터 닫기">×</button>
        </div>
        <div className="community-filter-option-grid">
          {secondaryFilters.map((filter) => {
            const selected = selectedIds.includes(filter.id)
            return (
              <button
                className={selected ? 'community-filter-option active' : 'community-filter-option'}
                key={filter.id}
                onClick={() => onToggle(filter.id)}
                type="button"
                aria-pressed={selected}
              >
                <span className={`filter-card-type ${filter.cardType}`}>{filter.cardType === 'qa' ? 'Q' : filter.cardType === 'album' ? 'A' : filter.cardType === 'notice' ? 'N' : filter.cardType === 'trade' ? 'T' : 'I'}</span>
                <span>
                  <strong>{filter.label}</strong>
                  <small>{filter.description}</small>
                </span>
                {selected ? <CheckCircle2 size={18} /> : null}
              </button>
            )
          })}
        </div>
        <div className="community-filter-sheet-actions">
          <button className="secondary-button grow" onClick={onReset} type="button">초기화</button>
          <button className="primary-button grow" onClick={onClose} type="button">적용</button>
        </div>
      </section>
    </div>,
    document.body,
  )
}

type CommunityFilterKey = 'region' | 'country' | 'language' | 'visa' | 'joinMode' | 'verification'

function CommunityGroupFilters({ filters, onChange, groups }: { filters: Record<CommunityFilterKey, string>; onChange: (key: CommunityFilterKey, value: string) => void; groups: CommunityGroup[] }) {
  const regions = uniqueOptions(groups.map((group) => group.regionName))
  const countries = uniqueOptions(groups.map((group) => group.countryCode).filter((code) => code !== 'ALL'))
  const languageOptions = uniqueOptions(groups.map((group) => group.languageCode))
  const visas = uniqueOptions(groups.flatMap((group) => group.visaTypes))
  return (
    <section className="community-filter-panel">
      <label>지역<select value={filters.region} onChange={(event) => onChange('region', event.target.value)}><option value="all">전체</option>{regions.map((region) => <option key={region} value={region}>{region}</option>)}</select></label>
      <label>국적<select value={filters.country} onChange={(event) => onChange('country', event.target.value)}><option value="all">전체</option>{countries.map((country) => <option key={country} value={country}>{countryFlag(country)} {country}</option>)}</select></label>
      <label>언어<select value={filters.language} onChange={(event) => onChange('language', event.target.value)}><option value="all">전체</option>{languageOptions.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
      <label>비자<select value={filters.visa} onChange={(event) => onChange('visa', event.target.value)}><option value="all">전체</option>{visas.map((visa) => <option key={visa} value={visa}>{visa}</option>)}</select></label>
      <label>가입 방식<select value={filters.joinMode} onChange={(event) => onChange('joinMode', event.target.value)}><option value="all">전체</option><option value="open">공개형</option><option value="approval">승인형</option><option value="conditional">조건형</option></select></label>
      <label>인증 조건<select value={filters.verification} onChange={(event) => onChange('verification', event.target.value)}><option value="all">전체</option><option value="required">국적 인증 필요</option><option value="none">인증 조건 없음</option></select></label>
    </section>
  )
}

function CommunityGroupHero({ group, membership, policy, onJoin, onReport }: { group: CommunityGroup; membership?: CommunityMembership; policy: ReturnType<typeof evaluateCommunityJoinPolicy>; onJoin: () => void; onReport: () => void }) {
  const heroImageUrl = group.backgroundImageUrl || group.groupImageUrl
  const isVisaVerifiedGroup = group.id === 'jeonbuk-e9-e8'
  const heroClassName = [
    'community-group-hero',
    group.isSafetyFocused ? 'safety' : '',
    group.backgroundImageUrl ? 'custom-hero' : '',
    group.heroVariant ? `variant-${group.heroVariant}` : '',
  ].filter(Boolean).join(' ')
  return (
    <article className={heroClassName}>
      {heroImageUrl ? <img src={assetUrl(heroImageUrl)} alt="" loading="lazy" decoding="async" /> : null}
      <div className="community-group-hero-copy">
        <div className="community-group-badges static">
          {group.isOfficialSeedGroup ? <mark>운영자 추천</mark> : null}
          {group.isSafetyFocused ? <mark className="danger">안전방</mark> : null}
          {isVisaVerifiedGroup ? <mark>비자 인증</mark> : null}
          <mark>{communityJoinModeLabel[group.joinMode]}</mark>
        </div>
        <h2>{countryFlag(group.countryCode)} {group.name}</h2>
        <p>{group.description}</p>
        <div className="community-group-meta"><span>{group.regionName}</span><span>{group.countryName}</span><span>{group.languageName}</span><span>{group.visaTypes.join(', ')}</span></div>
        <div className="condition-box">
          <strong>가입 조건</strong>
          <p>{group.requiredConditions.join(' · ')}</p>
          {group.joinMode === 'approval' ? <small>가입 질문 1~3개를 작성하면 운영진 승인 대기 상태가 됩니다. 현재는 mock 처리입니다.</small> : null}
          {group.joinMode === 'conditional' ? <small>{policy.allowed ? '현재 프로필 기준 가입 가능 상태입니다.' : `현재 프로필 기준 부족 조건: ${policy.missingConditions.join(', ') || '확인 필요'}`}</small> : null}
        </div>
        <div className="button-row">
          <button className="primary-button grow" disabled={membership?.status === 'joined' || (group.joinMode === 'conditional' && !policy.allowed)} onClick={onJoin} type="button">
            {membership?.status === 'joined' ? '가입됨' : membership?.status === 'pending' ? '승인 대기' : group.joinMode === 'approval' ? '가입 신청' : '가입하기'}
          </button>
          <button className="secondary-button danger grow" onClick={onReport} type="button"><Flag size={17} />그룹 신고</button>
        </div>
      </div>
    </article>
  )
}

function CommunitySafetyGuide() {
  return (
    <div className="community-guide-box">
      <ShieldCheck size={18} />
      <p>욕설, 혐오, 불법 알선, 허위 정보, 개인정보 노출 콘텐츠는 삭제될 수 있습니다. 타인의 얼굴, 연락처, 여권, 사업장 내부 사진이 노출되지 않도록 주의하세요.</p>
    </div>
  )
}

function CommunityPostRow({
  post,
  group,
  board,
  variant = 'list',
  translated = false,
  onOpen,
  onReport,
  onBlock,
  onTranslate,
}: {
  post: Post
  group?: CommunityGroup
  board?: CommunityBoard
  variant?: CommunityPostVariant
  translated?: boolean
  onOpen: () => void
  onReport: () => void
  onBlock: () => void
  onTranslate?: () => void
}) {
  const variantLabel = variant === 'qa' ? 'Q&A' : variant === 'album' ? '앨범' : '정보'
  const thumbnail = post.images?.[0]
  const thumbnailUrl = normalizeCommunityPostImage(thumbnail, group)
  return (
    <article className={`${post.hidden ? 'post-row community-post-row hidden-row' : 'post-row community-post-row'} community-post-${variant}`}>
      <button className="community-post-main" onClick={onOpen} type="button">
        <div className="community-post-layout">
          <div className="community-post-copy">
            <CommunityPostAuthorInline post={post} />
            <div className="community-post-meta">
              <span className={`community-post-kind ${variant}`}>{variantLabel}</span>
              <span>{group?.name || '공개 피드'}</span>
              <span>{board?.name || post.category}</span>
              <span>{group ? communityJoinModeLabel[group.joinMode] : '가입 없이 열람'}</span>
              <span>{post.originalLanguage || '한국어'} 원문</span>
              {post.isNotice ? <span>공지</span> : null}
              {post.isSafetyReport ? <span className="danger">안전 검토</span> : null}
            </div>
            <h3>{post.title}</h3>
            <p className="community-post-body">{post.body}</p>
            {translated ? <p className="community-post-translation">{post.translatedText || '번역 준비 중입니다.'}</p> : null}
            <div className="community-post-stats"><span>좋아요 {post.likeCount || 0}</span><span>댓글 {post.commentCount || post.comments.length}</span><span>조회 {post.viewCount || 0}</span><strong>{post.reported} 신고</strong></div>
          </div>
          {variant === 'album' ? (
            <span className="community-post-thumb">
              {thumbnailUrl ? <img src={assetUrl(thumbnailUrl)} alt={`${post.title} 앨범 이미지`} loading="lazy" decoding="async" /> : <Camera size={22} />}
            </span>
          ) : null}
        </div>
      </button>
      <div className="community-post-actions">
        {onTranslate ? <button className="ghost-button" onClick={onTranslate} type="button"><Languages size={14} />{translated ? '원문' : '번역'}</button> : null}
        <details className="community-post-more">
          <summary aria-label="게시글 더보기"><MoreHorizontal size={16} /></summary>
          <div>
            <button onClick={onReport} type="button"><Flag size={14} />신고</button>
            <button onClick={onBlock} type="button"><UserX size={14} />차단</button>
          </div>
        </details>
      </div>
    </article>
  )
}

function CommunityPostAuthorInline({ post }: { post: Post }) {
  const profile = profileForAuthor(post.author, post.authorId, {
    avatarUrl: post.avatarUrl,
    displayName: post.displayName || post.author,
    username: post.username,
    countryCode: post.countryCode,
    countryName: post.countryName,
    flagIconUrl: post.flagIconUrl,
    flagEmoji: post.flagEmoji,
    isCountryVerified: post.isCountryVerified,
    isVerified: post.isVerified,
    verificationStatus: post.verificationStatus,
    preferredLanguage: post.preferredLanguage,
    gradientColors: post.gradientColors,
  })
  const status = profileStatusLabel(profile)
  return (
    <div className="community-post-author-inline">
      <ProfileAvatar {...profile} size="sm" />
      <div>
        <strong>{profile.displayName || post.author}</strong>
        <span className={status === '미인증' ? 'unverified' : 'verified'}>{status}</span>
      </div>
    </div>
  )
}

function HelpDetailSection({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="help-detail-section">
      <h3>{title}</h3>
      <ul>
        {items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </section>
  )
}

function SupportInstitutionCard({ institution, compact = false }: { institution: SupportInstitution; compact?: boolean }) {
  return (
    <article className={compact ? 'support-institution-card compact' : 'support-institution-card'}>
      <div>
        <strong>{institution.name}</strong>
        <p>{institution.address}</p>
      </div>
      <div className="community-post-meta">
        <span>{institution.regionName}</span>
        <span>{institution.phone}</span>
        <span>{institution.availableLanguages.slice(0, 3).join(', ')}</span>
        {institution.reservationAvailable ? <span>예약 확인</span> : null}
      </div>
      {!compact ? (
        <>
          <p>{institution.openingHours}</p>
          <small>출처: {institution.sourceName} · 최종 업데이트 {institution.lastUpdated}</small>
          <small>{institution.cautionText}</small>
        </>
      ) : null}
    </article>
  )
}

function HelpRequestModal({
  category,
  profile,
  language,
  onClose,
  onSubmit,
}: {
  category: HelpCategoryView
  profile: UserProfile
  language: Language
  onClose: () => void
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
}) {
  return (
    <div className="modal-backdrop" role="presentation">
      <form className="help-request-modal" onSubmit={onSubmit} role="dialog" aria-modal="true" aria-labelledby="help-request-title">
        <div className="help-detail-head">
          <category.icon size={24} />
          <div>
            <p className="eyebrow">도움 요청 mock</p>
            <h2 id="help-request-title">상황을 간단히 남겨주세요</h2>
          </div>
        </div>
        <InfoBox icon={<ShieldCheck size={18} />} text="이 기능은 실제 기관 신고가 아니며, 운영자가 확인 후 관련 기관 정보를 안내하는 mock 흐름입니다." />
        <label>문제 유형<input name="type" defaultValue={category.title} readOnly /></label>
        <div className="form-grid">
          <label>지역<input name="region" defaultValue={profile.region} /></label>
          <label>선호 언어<select name="language" defaultValue={language}><option value="ko">한국어</option><option value="en">English</option><option value="vi">Tiếng Việt</option></select></label>
          <label>연락 가능 여부<select name="contactable" defaultValue="가능"><option>가능</option><option>나중에 가능</option><option>불가능</option></select></label>
        </div>
        <label>간단한 내용<textarea name="content" rows={4} placeholder="개인정보, 여권번호, 외국인등록번호는 입력하지 마세요." required /></label>
        <div className="button-row">
          <button className="primary-button grow" type="submit"><Send size={17} />접수하기</button>
          <button className="secondary-button grow" onClick={onClose} type="button">닫기</button>
        </div>
      </form>
    </div>
  )
}

function DailyComposerForm({
  t,
  profile,
  places,
  onSubmit,
  onCancel,
}: {
  t: Record<string, string>
  profile: UserProfile
  places: Place[]
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
  onCancel?: () => void
}) {
  return (
    <form className="form-card daily-composer-form" onSubmit={onSubmit}>
      <label>{t.addPhoto}<input name="images" type="file" accept="image/*" multiple /></label>
      <label>{t.bodyInput}<textarea name="body" rows={5} required placeholder="오늘의 한국 생활을 짧게 남겨보세요." /></label>
      <label>{t.category}<select name="category" defaultValue="한국생활">{dailyCategories.map((category) => <option key={category}>{category}</option>)}</select></label>
      <div className="form-grid">
        <label>{t.regionTag}<input name="region" defaultValue={profile.region} /></label>
        <label>{t.nationalityTag}<input name="nationality" defaultValue={profile.nationality} /></label>
        <label>{t.placeTag}<select name="place" defaultValue=""><option value="">None</option>{places.map((place) => <option key={place.id}>{place.name}</option>)}</select></label>
      </div>
      <label>{t.visibility}<select name="visibility" defaultValue="public"><option value="public">{t.public}</option><option value="nationality">{t.nationalityOnly}</option><option value="region">{t.regionOnly}</option></select></label>
      <div className="button-row">
        <button className="primary-button grow" type="submit">{t.publish}</button>
        {onCancel ? <button className="secondary-button grow" onClick={onCancel} type="button">{t.cancel || '취소'}</button> : null}
      </div>
    </form>
  )
}

function FeedComposerSheet({
  t,
  profile,
  places,
  onClose,
  onSubmit,
}: {
  t: Record<string, string>
  profile: UserProfile
  places: Place[]
  onClose: () => void
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
}) {
  return createPortal(
    <div className="composer-backdrop" role="presentation" onClick={onClose}>
      <section className="feed-composer-sheet" role="dialog" aria-modal="true" aria-labelledby="daily-composer-title" onClick={(event) => event.stopPropagation()}>
        <div className="sheet-handle" aria-hidden="true" />
        <div className="sheet-header">
          <div>
            <p className="eyebrow">Daily life</p>
            <h2 id="daily-composer-title">일상 작성</h2>
          </div>
          <button className="icon-button" onClick={onClose} type="button" aria-label="닫기">×</button>
        </div>
        <DailyComposerForm t={t} profile={profile} places={places} onSubmit={onSubmit} onCancel={onClose} />
      </section>
    </div>,
    document.body,
  )
}

function FloatingActionButton({ label, onClick }: { label: string; onClick: () => void }) {
  return createPortal(
    <button className="floating-action-button" onClick={onClick} type="button" aria-label="일상 작성">
      <Plus size={26} />
      <span>{label}</span>
    </button>,
    document.body,
  )
}

function uniqueOptions(values: string[]) {
  return Array.from(new Set(values)).filter(Boolean)
}

function FeedHeader({ feed, t, onReport, onHide }: { feed: DailyFeed; t: Record<string, string>; onReport: () => void; onHide: () => void }) {
  const profile = profileForAuthor(feed.author, feed.authorId, {
    avatarUrl: feed.avatarUrl,
    displayName: feed.displayName || feed.author,
    username: feed.username,
    countryCode: feed.countryCode,
    countryName: feed.countryName,
    flagIconUrl: feed.flagIconUrl,
    flagEmoji: feed.flagEmoji,
    isCountryVerified: feed.isCountryVerified,
    isVerified: feed.isVerified,
    verificationStatus: feed.verificationStatus,
    preferredLanguage: feed.preferredLanguage,
    gradientColors: feed.gradientColors,
  })

  return (
    <div className="feed-header">
      <ProfileIdentity user={profile} fallback={{ displayName: feed.author }} meta={`${feed.region} · ${visibilityLabel(feed.visibility, t)}`} size="md" className="feed-author-identity" />
      <div className="feed-header-actions">
        <button onClick={onReport} type="button" aria-label={t.report} title={t.report}><Flag size={17} /></button>
        <button onClick={onHide} type="button" aria-label={t.hide} title={t.hide}><MoreHorizontal size={18} /></button>
      </div>
    </div>
  )
}

function CommunityPostDetailView({
  post,
  board,
  membership,
  previousPost,
  nextPost,
  popularPosts,
  translated,
  helpCategory,
  onBackToCommunity,
  onJoinCommunity,
  onOpenPost,
  onTranslate,
  onComment,
  onReportPost,
  onBlockAuthor,
  onToggleHidden,
  onDelete,
  onHelp,
  onLifeMap,
  onReportComment,
  onShare,
}: {
  post: Post
  board?: CommunityBoard
  membership?: CommunityMembership
  previousPost?: Post
  nextPost?: Post
  popularPosts: Post[]
  translated: boolean
  helpCategory?: HelpCategoryView | null
  onBackToCommunity: () => void
  onJoinCommunity: () => void
  onOpenPost: (post: Post) => void
  onTranslate: () => void
  onComment: () => void
  onReportPost: () => void
  onBlockAuthor: () => void
  onToggleHidden: () => void
  onDelete: () => void
  onHelp: () => void
  onLifeMap: () => void
  onReportComment: () => void
  onShare: () => void
}) {
  const author = profileForAuthor(post.author, post.authorId, {
    avatarUrl: post.avatarUrl,
    displayName: post.displayName || post.author,
    username: post.username,
    countryCode: post.countryCode,
    countryName: post.countryName,
    flagIconUrl: post.flagIconUrl,
    flagEmoji: post.flagEmoji,
    isCountryVerified: post.isCountryVerified,
    isVerified: post.isVerified,
    verificationStatus: post.verificationStatus,
    preferredLanguage: post.preferredLanguage,
    gradientColors: post.gradientColors,
  })
  const body = translated ? post.translatedText || '번역 준비 중입니다.' : post.body
  const comments = post.comments.length ? post.comments : ['아직 댓글이 없습니다. 첫 댓글을 남겨보세요.']
  const isJoined = membership?.status === 'joined'

  return (
    <main className="community-detail-page">
      <article className="community-detail-article">
        <header className="community-detail-header">
          <div className="community-detail-author">
            <ProfileIdentity user={author} fallback={{ displayName: post.author }} size="md" />
          </div>
          <div className="community-detail-meta-row" aria-label="게시글 정보">
            <span>{post.originalLanguage || '한국어'} 원문</span>
            <span>{board?.name || post.category}</span>
            {post.isAnonymous ? <span>익명 주제</span> : null}
            {post.isSafetyReport ? <span className="danger">안전 검토</span> : null}
            <span>{communityPostTimeLabel(post.id)}</span>
          </div>
        </header>

        <h1 className="community-detail-title">{post.title}</h1>
        <p className="community-detail-body">{body}</p>

        {post.images.length ? (
          <div className="community-detail-media" aria-label="첨부 자료">
            {post.images.map((image) => isImageAssetPath(image) ? (
              <img key={image} src={assetUrl(image)} alt={`${post.title} 첨부 이미지`} loading="lazy" decoding="async" />
            ) : (
              <span className="community-detail-attachment" key={image}><ImagePlus size={16} />{image}</span>
            ))}
          </div>
        ) : null}

        {helpCategory ? (
          <div className="community-detail-help-strip">
            <HeartHandshake size={18} />
            <div>
              <strong>{helpCategory.shortTitle}</strong>
              <span>관련 도움 정보를 확인할 수 있습니다. 최종 판단은 관련 기관에 확인하세요.</span>
            </div>
            <button onClick={onHelp} type="button">도움 허브</button>
            <button onClick={onLifeMap} type="button">Life Map</button>
          </div>
        ) : null}

        <div className="community-detail-action-bar" aria-label="게시글 액션">
          <button type="button"><Heart size={17} />공감 {post.likeCount || 0}</button>
          <button onClick={onComment} type="button"><MessageCircle size={17} />댓글 {post.commentCount || comments.length}</button>
          <span><Eye size={17} />조회 {post.viewCount || 0}</span>
          <button onClick={onTranslate} type="button"><Languages size={17} />{translated ? '원문' : '번역'}</button>
          <button onClick={onShare} type="button"><Share2 size={17} />공유</button>
          <details className="community-detail-more">
            <summary aria-label="게시글 더보기"><MoreHorizontal size={18} /></summary>
            <div>
              <button onClick={onReportPost} type="button"><Flag size={14} />게시글 신고</button>
              <button onClick={onBlockAuthor} type="button"><UserX size={14} />사용자 차단</button>
              <button onClick={onToggleHidden} type="button"><ShieldCheck size={14} />{post.hidden ? '숨김 해제' : '숨김'}</button>
              <button className="danger" onClick={onDelete} type="button"><Trash2 size={14} />삭제</button>
            </div>
          </details>
        </div>

        <section className="community-detail-comments" aria-label="댓글">
          <div className="community-comments-heading">
            <span>댓글</span>
            {post.isSafetyReport ? <p>개인정보나 상대방을 특정할 수 있는 내용은 조심해서 작성해주세요.</p> : null}
          </div>
          <div className="community-detail-comment-input">
            <input placeholder="댓글을 입력하세요" />
            <button className="icon-button" onClick={onComment} type="button" aria-label="댓글 등록"><Send size={17} /></button>
          </div>
          <div className="community-comment-list">
            {comments.map((comment, index) => (
              <CommunityCommentItem
                key={`${post.id}-${comment}-${index}`}
                comment={comment}
                index={index}
                onReport={onReportComment}
                showReply={index === 0 && post.comments.length > 0}
              />
            ))}
          </div>
        </section>
      </article>

      <section className="community-detail-footer-actions" aria-label="커뮤니티 이동">
        <div>
          <span className="community-detail-section-kicker">커뮤니티 참여</span>
          <strong>{isJoined ? '이 커뮤니티에 참여 중입니다' : '이 글이 유용했다면 커뮤니티에 참여해보세요'}</strong>
        </div>
        <div className="community-detail-footer-buttons">
          <button className="community-footer-action ghost" onClick={onBackToCommunity} type="button"><UsersRound size={17} />커뮤니티 둘러보기</button>
          <button className={isJoined ? 'community-footer-action joined' : 'community-footer-action primary'} onClick={isJoined ? onBackToCommunity : onJoinCommunity} type="button">
            {isJoined ? <CheckCircle2 size={17} /> : <Plus size={17} />}{isJoined ? '가입됨' : '커뮤니티 가입'}
          </button>
        </div>
      </section>

      <section className="community-post-navigation" aria-label="이전글 다음글">
        <button className="community-nav-card prev" disabled={!previousPost} onClick={() => previousPost ? onOpenPost(previousPost) : undefined} type="button">
          <span><ChevronLeft size={16} />이전글</span>
          <strong>{previousPost?.title || '이전글이 없습니다'}</strong>
          {previousPost ? <small>{previousPost.category} · 댓글 {previousPost.commentCount || previousPost.comments.length}</small> : null}
        </button>
        <button className="community-nav-card next" disabled={!nextPost} onClick={() => nextPost ? onOpenPost(nextPost) : undefined} type="button">
          <span>다음글<ChevronRight size={16} /></span>
          <strong>{nextPost?.title || '다음글이 없습니다'}</strong>
          {nextPost ? <small>{nextPost.category} · 댓글 {nextPost.commentCount || nextPost.comments.length}</small> : null}
        </button>
      </section>

      <section className="popular-community-posts" aria-label="다른 인기 커뮤니티글">
        <div className="popular-community-heading">
          <div>
            <span className="community-detail-section-kicker">이어보기</span>
            <h2>다른 인기 커뮤니티글</h2>
          </div>
          <span>많이 본 글 3개</span>
        </div>
        <div className="popular-community-list">
          {popularPosts.map((item) => (
            <button key={item.id} onClick={() => onOpenPost(item)} type="button">
              <span className="popular-community-rank">{popularPosts.indexOf(item) + 1}</span>
              <span className="popular-community-copy">
                <strong>{item.title}</strong>
                <span>{item.category} · 댓글 {item.commentCount || item.comments.length} · 공감 {item.likeCount || 0} · {communityPostTimeLabel(item.id)}</span>
              </span>
              <ChevronRight size={17} />
            </button>
          ))}
        </div>
      </section>
    </main>
  )
}

function CommunityCommentItem({ comment, index, onReport, showReply }: { comment: string; index: number; onReport: () => void; showReply?: boolean }) {
  const user = getSampleUserById(index + 5) || getSampleUserForName(comment, index)
  const replyUser = getSampleUserById(index + 8) || getSampleUserForName('답글 작성자', index + 8)

  return (
    <div className="community-comment-thread">
      <div className="community-comment-item">
        <ProfileAvatar {...user} size="sm" />
        <div className="community-comment-copy">
          <div className="community-comment-head">
            <strong>{user.displayName || user.username || '사용자'}</strong>
            <span>{profileStatusLabel(user)}</span>
            <small>{index === 0 ? '2시간 전' : '방금 전'}</small>
          </div>
          <p>{comment}</p>
          <div>
            <button type="button"><Heart size={14} />공감</button>
            <button type="button"><MessageCircle size={14} />답글</button>
            <button onClick={onReport} type="button"><Flag size={14} />신고</button>
          </div>
        </div>
      </div>
      {showReply ? (
        <div className="community-comment-item reply">
          <ProfileAvatar {...replyUser} size="sm" />
          <div className="community-comment-copy">
            <div className="community-comment-head">
              <strong>{replyUser.displayName || replyUser.username || '사용자'}</strong>
              <span>{profileStatusLabel(replyUser)}</span>
              <small>1시간 전</small>
            </div>
            <p>정보 감사합니다. 관련 기관 안내도 함께 확인해볼게요.</p>
            <div>
              <button type="button"><Heart size={14} />공감</button>
              <button onClick={onReport} type="button"><Flag size={14} />신고</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function communityPostTimeLabel(postId: number) {
  if (postId % 5 === 0) return '2시간 전'
  if (postId % 3 === 0) return '8시간 전'
  if (postId % 2 === 0) return '어제'
  return '3일 전'
}

function normalizeCommunityPostImage(image: string | undefined, group?: CommunityGroup) {
  if (image && isImageAssetPath(image)) return image
  if (group?.backgroundImageUrl) return group.backgroundImageUrl
  if (group?.groupImageUrl) return group.groupImageUrl
  return '/mock/community/backgrounds/bg_worker.jpg'
}

function getCommunityPostNavigation(currentPost: Post, posts: Post[]) {
  const siblings = posts
    .filter((post) => !post.deleted && !post.hidden)
    .filter((post) => post.groupId === currentPost.groupId)
    .sort((a, b) => a.id - b.id)
  const index = siblings.findIndex((post) => post.id === currentPost.id)
  return {
    previous: index > 0 ? siblings[index - 1] : undefined,
    next: index >= 0 && index < siblings.length - 1 ? siblings[index + 1] : undefined,
  }
}

function getPopularCommunityPosts(currentPost: Post, posts: Post[]) {
  return posts
    .filter((post) => post.id !== currentPost.id && !post.deleted && !post.hidden)
    .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0) || (b.likeCount || 0) - (a.likeCount || 0))
    .slice(0, 3)
}

function isImageAssetPath(value: string) {
  return value.startsWith('/') || value.startsWith('http') || value.startsWith('data:image')
}

function ReviewLine({ review, index }: { review: string; index: number }) {
  const profile = getSampleUserById(index + 1) || getSampleUserForName(review, index)
  return (
    <div className="review-line">
      <ProfileIdentity user={profile} size="sm" />
      <div className="review-copy">
        <p>{review}</p>
      </div>
    </div>
  )
}

function FeedCarousel({ feed }: { feed: DailyFeed }) {
  const images = feed.images?.length ? feed.images : [{ id: 1, url: feed.image, alt: `${feed.author} daily life` }]
  const [activeIndex, setActiveIndex] = useState(0)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const hasMultipleImages = images.length > 1
  const goTo = (nextIndex: number) => setActiveIndex((nextIndex + images.length) % images.length)

  return (
    <div className="feed-media-wrap">
      <div
        className="feed-carousel"
        onTouchStart={(event) => setTouchStart(event.touches[0].clientX)}
        onTouchEnd={(event) => {
          if (touchStart === null) return
          const delta = event.changedTouches[0].clientX - touchStart
          if (Math.abs(delta) > 38) goTo(activeIndex + (delta < 0 ? 1 : -1))
          setTouchStart(null)
        }}
      >
        <div className="feed-track" style={{ transform: `translateX(-${activeIndex * 100}%)` }}>
          {images.map((image, index) => (
            <div className="feed-slide" key={`${feed.id}-${image.id}`}>
              <img
                src={assetUrl(image.url)}
                alt={image.alt || `${feed.author} daily life ${index + 1}`}
                loading={index === 0 ? 'eager' : 'lazy'}
                decoding="async"
              />
            </div>
          ))}
        </div>
        {hasMultipleImages ? <span className="feed-counter">{activeIndex + 1}/{images.length}</span> : null}
        {hasMultipleImages ? (
          <>
            <button className="feed-nav prev" onClick={() => goTo(activeIndex - 1)} type="button" aria-label="Previous photo"><ChevronLeft size={19} /></button>
            <button className="feed-nav next" onClick={() => goTo(activeIndex + 1)} type="button" aria-label="Next photo"><ChevronRight size={19} /></button>
          </>
        ) : null}
      </div>
      {hasMultipleImages ? <FeedIndicator total={images.length} activeIndex={activeIndex} onSelect={goTo} /> : null}
    </div>
  )
}

function FeedIndicator({ total, activeIndex, onSelect }: { total: number; activeIndex: number; onSelect: (index: number) => void }) {
  return (
    <div className="feed-indicator" aria-label="Photo position">
      {Array.from({ length: total }).map((_, index) => (
        <button
          className={index === activeIndex ? 'active' : ''}
          key={index}
          onClick={() => onSelect(index)}
          type="button"
          aria-label={`Go to photo ${index + 1}`}
        />
      ))}
    </div>
  )
}

function FeedActions({ feed, t, onLike, onComment, onSave }: { feed: DailyFeed; t: Record<string, string>; onLike: () => void; onComment: () => void; onSave: () => void }) {
  return (
    <div className="feed-actions">
      <div className="feed-action-left">
        <button onClick={onLike} type="button" aria-label="Like feed"><Heart size={22} fill={feed.likes > 0 ? 'currentColor' : 'none'} /></button>
        <button onClick={onComment} type="button" aria-label="Comment feed"><MessageCircle size={22} /></button>
        <button type="button" aria-label="Share feed"><Send size={22} /></button>
      </div>
      <button className="feed-save-button" onClick={onSave} type="button" aria-label={t.save}><Bookmark size={22} fill={feed.saved ? 'currentColor' : 'none'} /></button>
    </div>
  )
}

function FeedCaption({
  feed,
  t,
  translated,
  expanded,
  setExpanded,
  onTranslate,
  place,
  job,
  onPlace,
  onJob,
  onHelp,
  onQuestion,
}: {
  feed: DailyFeed
  t: Record<string, string>
  translated: boolean
  expanded: boolean
  setExpanded: (value: boolean) => void
  onTranslate: () => void
  place?: Place
  job?: Job
  onPlace: () => void
  onJob: () => void
  onHelp: () => void
  onQuestion: () => void
}) {
  const body = translated ? feed.translatedBody : feed.body
  const isLong = body.length > 86

  return (
    <div className="feed-caption">
      <strong className="feed-counts">좋아요 {feed.likes.toLocaleString()} · 댓글 {feed.comments.length.toLocaleString()}</strong>
      <p className={expanded ? 'caption-text' : 'caption-text clamped'}>
        <strong>{feed.author}</strong> {body}
      </p>
      {isLong ? (
        <button className="caption-more" onClick={() => setExpanded(!expanded)} type="button">
          {expanded ? '접기' : '더 보기'}
        </button>
      ) : null}
      <div className="feed-tags">
        <span>{feed.category}</span>
        {feed.hashtags.map((tag) => <span key={tag}>{tag}</span>)}
      </div>
      <div className="feed-link-row">
        <button onClick={onTranslate} type="button"><Languages size={16} />{t.translate}</button>
        {place ? <button onClick={onPlace} type="button"><MapPin size={16} />{place.name}</button> : null}
        {job ? <button onClick={onJob} type="button"><BriefcaseBusiness size={16} />{t.linkedJob}</button> : null}
        {hasDangerKeyword(feed) ? <button className="danger" onClick={onHelp} type="button"><AlertTriangle size={16} />{t.askHelp}</button> : null}
        {feed.category === dailyCategories[5] ? <button onClick={onQuestion} type="button"><MessageCircle size={16} />{t.shareQuestion}</button> : null}
      </div>
      <time>{feed.createdAt}</time>
    </div>
  )
}

function visibilityLabel(value: DailyVisibility, t: Record<string, string>) {
  if (value === 'nationality') return t.nationalityOnly
  if (value === 'region') return t.regionOnly
  return t.public
}

function AuthPanel({ icon, title, children, wide = false }: { icon: React.ReactNode; title: string; children: React.ReactNode; wide?: boolean }) {
  return <section className={wide ? 'auth-panel wide' : 'auth-panel'}>{icon}<h1>{title}</h1>{children}</section>
}

function ScreenFrame({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return <section className="screen-frame"><div className="screen-header"><h1>{title}</h1><p>{subtitle}</p></div>{children}</section>
}

function DetailFrame({
  title,
  children,
  back: _back,
  backLabel: _backLabel,
  showBack: _showBack = true,
}: {
  title: string
  back: () => void
  backLabel: string
  children: React.ReactNode
  showBack?: boolean
}) {
  return (
    <section className={title ? 'screen-frame' : 'screen-frame compact-detail-frame'}>
      {title ? <div className="screen-header"><h1>{title}</h1></div> : null}
      {children}
    </section>
  )
}

function SectionTitle({ title, action }: { title: string; action?: string }) {
  return <h2 className="section-title">{title}{action ? <span>{action}</span> : null}</h2>
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="panel"><h2>{title}</h2>{children}</section>
}

function HelpRequestIcon({ size = 22, className = '' }: { size?: number; className?: string }) {
  const iconClassName = ['help-request-icon', className].filter(Boolean).join(' ')
  const width = Math.round(size * 1.34)

  return (
    <svg className={iconClassName} width={width} height={size} viewBox="0 0 64 48" fill="none" aria-hidden="true" focusable="false">
      <path
        d="M9.5 4.8h45c4 0 7.2 3.2 7.2 7.2v18.2c0 4-3.2 7.2-7.2 7.2H35.4l-8.8 7.6c-1.5 1.3-3.8.3-3.8-1.7v-5.9H9.5c-4 0-7.2-3.2-7.2-7.2V12c0-4 3.2-7.2 7.2-7.2Z"
        fill="currentColor"
        opacity="0.14"
        stroke="currentColor"
        strokeWidth="3.6"
        strokeLinejoin="round"
      />
      <text
        x="32"
        y="25.8"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="currentColor"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="15"
        fontWeight="900"
        letterSpacing="0.8"
      >
        HELP
      </text>
    </svg>
  )
}

function QuickButton({ icon: Icon, label, onClick }: { icon: AppIcon; label: string; onClick: () => void }) {
  return <button className="quick-button" onClick={onClick} type="button"><Icon size={22} /><span>{label}</span></button>
}

function ListButton({ title, meta, onClick }: { title: string; meta: string; onClick: () => void }) {
  return <button className="list-button" onClick={onClick} type="button"><span>{title}</span><small>{meta}</small><ChevronRight size={16} /></button>
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="metric"><span>{label}</span><strong>{value}</strong></div>
}

function AdminTile({ icon: Icon, label, value, onClick }: { icon: typeof Home; label: string; value: string; onClick: () => void }) {
  return <button className="admin-tile" onClick={onClick} type="button"><Icon size={22} /><span>{label}</span><strong>{value}</strong></button>
}

function TabButton({ item, active, onClick }: { item: NavItem; active: boolean; onClick: () => void }) {
  const Icon = item.icon
  return <button className={active ? 'tab-button active' : 'tab-button'} onClick={onClick} type="button" title={item.label}><Icon size={20} /><span>{item.label}</span></button>
}

function StatusPill({ label }: { label: string }) {
  return <mark>{label}</mark>
}

function VisaStatusBadge({ match }: { match: VisaJobMatch }) {
  return <span className={`visa-status-badge ${match.status}`}>{match.badgeLabel}</span>
}

function VisaJobNotice({ visaType, match }: { visaType: VisaType; match: VisaJobMatch }) {
  return (
    <section className={`visa-job-notice ${match.status}`} aria-label="비자 적합성 안내">
      <div className="visa-job-notice-head">
        <ShieldCheck size={18} />
        <div>
          <strong>비자 적합성 안내</strong>
          <p>선택한 비자: {getVisaTypeLabel(visaType)}</p>
        </div>
        <VisaStatusBadge match={match} />
      </div>
      <div className="visa-job-notice-body">
        <p><b>판정</b>{match.title}</p>
        <p><b>안내</b>{match.summary} {match.note}</p>
        <small>{visaLegalNotice}</small>
      </div>
    </section>
  )
}

function InfoLine({ icon, text }: { icon: React.ReactNode; text: string }) {
  return <div className="info-line">{icon}<span>{text}</span></div>
}

function InfoBox({ icon, text }: { icon: React.ReactNode; text: string }) {
  return <div className="info-box">{icon}<span>{text}</span></div>
}

function AdminManage({ title, back, children }: { title: string; back: () => void; children: React.ReactNode }) {
  return <DetailFrame title={title} back={back} backLabel="Back"><Panel title={title}>{children}</Panel></DetailFrame>
}

function AdminLogs({ logs }: { logs: AdminLog[] }) {
  return (
    <Panel title="관리자 처리 이력">
      <div className="admin-log-list">
        {logs.slice(0, 6).map((log) => (
          <div className="admin-row" key={log.id}>
            <span>{log.action}</span>
            <small>{log.target} · {log.detail}</small>
            <strong>{log.createdAt}</strong>
          </div>
        ))}
      </div>
    </Panel>
  )
}

export default App
