import type { CommunityGroup, User, UserProfile } from './types'

export type CommunityJoinPolicyResult = {
  allowed: boolean
  mode: CommunityGroup['joinMode']
  reasons: string[]
  missingConditions: string[]
}

export type CommunityJoinPolicyInput = {
  group: CommunityGroup
  profile: UserProfile
  user?: User
}

export function evaluateCommunityJoinPolicy({ group, profile, user }: CommunityJoinPolicyInput): CommunityJoinPolicyResult {
  const missingConditions: string[] = []

  if (group.joinMode !== 'conditional') {
    return {
      allowed: true,
      mode: group.joinMode,
      reasons: [group.joinMode === 'approval' ? '운영진 승인 후 가입됩니다.' : '공개형 그룹은 즉시 가입할 수 있습니다.'],
      missingConditions,
    }
  }

  const countryOk = group.countryCode === 'ALL' || group.countryName === profile.nationality || group.countryCode === user?.countryCode
  const regionOk = group.regionName === '전국' || group.regionName === profile.region || group.regionName.split(' ')[0] === profile.region.split(' ')[0]
  const visaOk = group.visaTypes.includes(profile.visa)
  const verifiedOk = !group.requiresCountryVerification || user?.isCountryVerified === true || user?.verificationStatus === 'verified'

  if (!countryOk) missingConditions.push('국적 조건')
  if (!regionOk) missingConditions.push('지역 조건')
  if (!visaOk) missingConditions.push('비자 조건')
  if (!verifiedOk) missingConditions.push('국적 인증')

  return {
    allowed: missingConditions.length === 0,
    mode: group.joinMode,
    reasons: missingConditions.length === 0 ? ['현재 프로필 기준 조건형 그룹 가입이 가능합니다.'] : ['현재 프로필 기준 일부 조건이 맞지 않습니다.'],
    missingConditions,
  }
}
