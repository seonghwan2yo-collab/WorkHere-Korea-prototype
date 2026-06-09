import type { Job } from '../types'

export type VisaType =
  | 'ALL'
  | 'E-9'
  | 'E-10'
  | 'H-2'
  | 'F-4'
  | 'E-7'
  | 'E-7-4'
  | 'F-2'
  | 'F-5'
  | 'F-6'
  | 'D-2'
  | 'D-4'
  | 'KOREAN_NATIONALIZED'
  | 'UNKNOWN'

export type VisaJobStatus = 'eligible' | 'caution' | 'restricted' | 'unknown'

export type VisaJobMatch = {
  status: VisaJobStatus
  badgeLabel: string
  title: string
  summary: string
  note: string
  rank: number
}

export const visaTypeOptions: Array<{ value: VisaType; label: string; shortLabel: string }> = [
  { value: 'ALL', label: '전체', shortLabel: '전체' },
  { value: 'E-9', label: 'E-9 비전문취업', shortLabel: 'E-9' },
  { value: 'E-10', label: 'E-10 선원취업', shortLabel: 'E-10' },
  { value: 'H-2', label: 'H-2 방문취업', shortLabel: 'H-2' },
  { value: 'F-4', label: 'F-4 재외동포', shortLabel: 'F-4' },
  { value: 'E-7', label: 'E-7 전문/특정활동', shortLabel: 'E-7' },
  { value: 'E-7-4', label: 'E-7-4 숙련기능', shortLabel: 'E-7-4' },
  { value: 'F-2', label: 'F-2 거주', shortLabel: 'F-2' },
  { value: 'F-5', label: 'F-5 영주', shortLabel: 'F-5' },
  { value: 'F-6', label: 'F-6 결혼이민', shortLabel: 'F-6' },
  { value: 'D-2', label: 'D-2 유학', shortLabel: 'D-2' },
  { value: 'D-4', label: 'D-4 일반연수', shortLabel: 'D-4' },
  { value: 'KOREAN_NATIONALIZED', label: '한국 국적/귀화', shortLabel: '한국 국적' },
  { value: 'UNKNOWN', label: '비자 미확인', shortLabel: '미확인' },
]

const statusRank: Record<VisaJobStatus, number> = {
  eligible: 1,
  caution: 2,
  unknown: 3,
  restricted: 4,
}

const e9Eligible = ['manufacturing', 'construction', 'agriculture', 'fishery', 'livestock', 'cold-storage', 'recycling', 'hotel-support']
const e9Restricted = ['food-service', 'accommodation', 'office', 'white-collar', 'admin', 'beauty', 'entertainment']
const e10Eligible = ['fishery', 'vessel', 'marine', 'cruise', 'seafarer']
const h2Eligible = ['manufacturing', 'construction', 'service', 'agriculture', 'fishery', 'food-service', 'hotel-support', 'cold-storage']
const f4Eligible = ['office', 'professional', 'service', 'trade', 'technical', 'admin']
const simpleLabor = ['simple-labor', 'day-labor', 'manufacturing', 'agriculture', 'fishery', 'cold-storage', 'recycling']
const skilledEligible = ['skilled', 'professional', 'technical', 'manufacturing-skilled', 'welding', 'machinery', 'engineering']

export function getVisaTypeLabel(visaType: string) {
  return visaTypeOptions.find((option) => option.value === visaType)?.label || visaType
}

export function getVisaTypeShortLabel(visaType: string) {
  return visaTypeOptions.find((option) => option.value === visaType)?.shortLabel || visaType
}

export function getVisaFilterNotice(visaType: VisaType) {
  if (visaType === 'E-9') return 'E-9 비자는 허용 업종 중심으로 공고를 보여드립니다. 최종 취업 가능 여부는 고용허가 및 사업장 조건 확인이 필요합니다.'
  if (visaType === 'D-2' || visaType === 'D-4') return '유학·연수 비자는 원칙적으로 취업이 제한되며, 시간제취업 등 자격외활동 허가가 필요할 수 있습니다.'
  if (visaType === 'UNKNOWN' || visaType === 'ALL') return '비자를 선택하면 지원 가능한 일자리를 더 정확히 볼 수 있어요.'
  return `${getVisaTypeLabel(visaType)} 기준으로 추천 공고를 먼저 보여드립니다. 최종 가능 여부는 사업장 및 관계기관 확인이 필요합니다.`
}

export function getVisaJobMatch(job: Job, visaType: VisaType): VisaJobMatch {
  const shortVisa = getVisaTypeShortLabel(visaType)
  const industry = job.industryCode || job.category || ''
  const employmentType = job.employmentType || ''

  if (visaType === 'ALL' || visaType === 'UNKNOWN') {
    return makeMatch('unknown', '비자 선택 필요', '비자 미확인', '비자를 선택하면 더 정확한 추천을 볼 수 있습니다.', job.visaNote || '비자별 일자리 정보는 참고용입니다.')
  }

  if (visaType === 'KOREAN_NATIONALIZED') {
    return makeMatch('eligible', '일반 지원 가능', '일반 지원 가능', '비자 제한 없이 일반 공고로 확인할 수 있습니다.', '다만 자격증, 경력, 사업장 조건은 별도 확인이 필요합니다.')
  }

  if (job.restrictedVisaTypes?.includes(visaType)) {
    return makeMatch('restricted', `${shortVisa} 지원 제한`, '지원 제한 가능성이 있습니다.', '이 비자 유형에는 적합하지 않을 수 있는 공고입니다.', job.visaNote || '최종 가능 여부는 관계기관 확인이 필요합니다.')
  }

  if (job.cautionVisaTypes?.includes(visaType)) {
    return makeMatch('caution', cautionBadge(visaType), '확인이 필요한 공고입니다.', cautionSummary(visaType), job.visaNote || '공고 조건과 체류자격 조건을 함께 확인하세요.')
  }

  if (job.allowedVisaTypes?.includes(visaType)) {
    return makeMatch('eligible', `${shortVisa} 지원 가능`, '지원 가능성이 높은 공고입니다.', '공고에 허용 비자 유형으로 표시되어 있습니다.', job.visaNote || '최종 가능 여부는 사업장 및 관계기관 확인이 필요합니다.')
  }

  if (visaType === 'E-9') {
    if (e9Restricted.includes(industry)) return makeMatch('restricted', 'E-9 지원 제한', '지원 제한 가능성이 있습니다.', '음식점, 숙박, 사무직 등은 E-9 비자에 적합하지 않을 수 있습니다.', job.visaNote || 'E-9 허용 업종 여부 확인이 필요합니다.')
    if (e9Eligible.includes(industry)) return makeMatch('eligible', 'E-9 지원 가능', '지원 가능성이 높은 공고입니다.', 'E-9 허용 업종으로 분류될 수 있는 공고입니다.', job.visaNote || '고용허가 및 사업장 조건 확인이 필요합니다.')
    return makeMatch('caution', '비자 확인 필요', '확인이 필요한 공고입니다.', 'E-9 허용 업종 해당 여부 확인이 필요합니다.', job.visaNote || '관계기관 또는 사업장 확인이 필요합니다.')
  }

  if (visaType === 'E-10') {
    return e10Eligible.includes(industry)
      ? makeMatch('eligible', 'E-10 가능', '지원 가능성이 높은 공고입니다.', '선원취업 계열 공고로 분류될 수 있습니다.', job.visaNote || '승선/선원 관련 조건 확인이 필요합니다.')
      : makeMatch('caution', '비자 확인 필요', '확인이 필요한 공고입니다.', 'E-10 비자와 업종 적합성 확인이 필요합니다.', job.visaNote || '관계기관 확인이 필요합니다.')
  }

  if (visaType === 'H-2') {
    return h2Eligible.includes(industry)
      ? makeMatch('eligible', 'H-2 가능', '지원 가능성이 높은 공고입니다.', 'H-2 허용 업종으로 검토 가능한 공고입니다.', job.visaNote || '허용업종 확인이 필요합니다.')
      : makeMatch('caution', '허용업종 확인', '확인이 필요한 공고입니다.', 'H-2 허용 업종 해당 여부 확인이 필요합니다.', job.visaNote || '사업장 조건 확인이 필요합니다.')
  }

  if (visaType === 'F-4') {
    if (simpleLabor.includes(industry)) return makeMatch('caution', '단순노무 여부 확인', '확인이 필요한 공고입니다.', '단순노무 해당 여부 확인이 필요합니다.', job.visaNote || '업무 내용 확인이 필요합니다.')
    if (f4Eligible.includes(industry)) return makeMatch('eligible', 'F-4 가능', '지원 가능성이 높은 공고입니다.', '사무, 전문, 서비스, 무역 계열로 검토 가능한 공고입니다.', job.visaNote || '세부 업무 확인이 필요합니다.')
  }

  if (visaType === 'F-2' || visaType === 'F-5' || visaType === 'F-6') {
    return job.requiresVisaCheck
      ? makeMatch('caution', `${shortVisa} 확인 필요`, '확인이 필요한 공고입니다.', '자격증, 면허, 사업장 조건 확인이 필요할 수 있습니다.', job.visaNote || '세부 조건 확인이 필요합니다.')
      : makeMatch('eligible', `${shortVisa} 가능`, '지원 가능성이 높은 공고입니다.', '대부분의 공고를 검토할 수 있는 체류자격입니다.', job.visaNote || '최종 가능 여부는 사업장 확인이 필요합니다.')
  }

  if (visaType === 'E-7' || visaType === 'E-7-4') {
    if (skilledEligible.includes(industry)) return makeMatch('eligible', `${shortVisa} 가능`, '지원 가능성이 높은 공고입니다.', '숙련, 전문, 기술 계열 공고로 분류될 수 있습니다.', job.visaNote || '직종코드와 자격요건 확인이 필요합니다.')
    if (simpleLabor.includes(industry)) return makeMatch('caution', '단순노무 여부 확인', '확인이 필요한 공고입니다.', '단순노무 공고는 적합하지 않을 수 있습니다.', job.visaNote || '직무 내용 확인이 필요합니다.')
  }

  if (visaType === 'D-2' || visaType === 'D-4') {
    return employmentType === 'part-time'
      ? makeMatch('caution', '자격외활동 허가 필요', '확인이 필요한 공고입니다.', '시간제취업 등 자격외활동 허가가 필요할 수 있습니다.', job.visaNote || '학교와 출입국 관련 확인이 필요합니다.')
      : makeMatch('restricted', `${shortVisa} 지원 제한`, '지원 제한 가능성이 있습니다.', '유학·연수 비자는 원칙적으로 전일제 취업이 제한될 수 있습니다.', job.visaNote || '자격외활동 허가 여부 확인이 필요합니다.')
  }

  return makeMatch('caution', '비자 확인 필요', '확인이 필요한 공고입니다.', '선택한 비자와 공고 조건을 함께 확인해야 합니다.', job.visaNote || '최종 가능 여부는 관계기관 확인이 필요합니다.')
}

function makeMatch(status: VisaJobStatus, badgeLabel: string, title: string, summary: string, note: string): VisaJobMatch {
  return { status, badgeLabel, title, summary, note, rank: statusRank[status] }
}

function cautionBadge(visaType: VisaType) {
  if (visaType === 'D-2' || visaType === 'D-4') return '자격외활동 허가 필요'
  if (visaType === 'F-4' || visaType === 'E-7' || visaType === 'E-7-4') return '단순노무 여부 확인'
  return '비자 확인 필요'
}

function cautionSummary(visaType: VisaType) {
  if (visaType === 'D-2' || visaType === 'D-4') return '취업 전 자격외활동 허가 여부 확인이 필요합니다.'
  if (visaType === 'F-4') return '단순노무 해당 여부 확인이 필요합니다.'
  return '체류자격과 공고 조건을 함께 확인해야 합니다.'
}
