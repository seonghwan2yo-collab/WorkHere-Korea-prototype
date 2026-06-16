import sampleUsersData from '../../data/sampleUsers.json'

export type VerificationStatus = 'verified' | 'unverified' | 'pending'

export type ProfileUser = {
  id?: number | string
  displayName?: string
  username?: string
  userId?: string | number
  avatarUrl?: string | null
  countryCode?: string
  countryName?: string
  flagIconUrl?: string | null
  flagEmoji?: string
  isVerified?: boolean
  isCountryVerified?: boolean
  verificationStatus?: VerificationStatus | string
  preferredLanguage?: string
  gradientColors?: string[]
}

export const sampleUsers = sampleUsersData as ProfileUser[]

export const fallbackProfileUser: ProfileUser = {
  id: 'fallback',
  displayName: 'WorkHere User',
  username: 'workhere_user',
  countryCode: 'GL',
  countryName: '국가',
  flagEmoji: '🌐',
  isCountryVerified: false,
  verificationStatus: 'unverified',
  preferredLanguage: 'ko',
  gradientColors: ['#98A2B3', '#D0D5DD'],
}

function fallbackAvatarUrl(user?: ProfileUser) {
  const source = String(user?.id || user?.userId || user?.username || user?.displayName || '1')
  const sum = Array.from(source).reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const avatarId = (sum % 24) + 1
  return `/mock/avatars/processed/avatar-${String(avatarId).padStart(3, '0')}.webp`
}

export function isProfileVerified(user?: ProfileUser) {
  return Boolean(user?.isCountryVerified || user?.isVerified || user?.verificationStatus === 'verified')
}

export function profileInitial(user?: ProfileUser) {
  const source = user?.displayName || user?.username || String(user?.userId || user?.id || '')
  return source.trim().slice(0, 1).toUpperCase() || '?'
}

export function profileDisplayName(user?: ProfileUser) {
  return user?.displayName || user?.username || String(user?.userId || user?.id || '사용자')
}

export function profileStatusLabel(user?: ProfileUser) {
  if (!isProfileVerified(user)) return '미인증'
  return `${user?.countryCode || ''} ${user?.countryName || '국가'} 인증`.trim()
}

export function getSampleUserById(id?: number | string) {
  if (id === undefined || id === null) return undefined
  return sampleUsers.find((user) => String(user.id) === String(id))
}

export function getSampleUserForName(name?: string, offset = 0) {
  if (!sampleUsers.length) return fallbackProfileUser
  if (!name) return sampleUsers[offset % sampleUsers.length]
  const exact = sampleUsers.find((user) => user.displayName === name || user.username === name)
  if (exact) return exact
  const sum = Array.from(name).reduce((acc, char) => acc + char.charCodeAt(0), offset)
  return sampleUsers[sum % sampleUsers.length]
}

export function mergeProfileUser(primary?: ProfileUser, fallback?: ProfileUser): ProfileUser {
  const merged = {
    ...fallbackProfileUser,
    ...fallback,
    ...primary,
    gradientColors: primary?.gradientColors || fallback?.gradientColors || fallbackProfileUser.gradientColors,
  }

  return {
    ...merged,
    avatarUrl: primary?.avatarUrl || fallback?.avatarUrl || fallbackAvatarUrl(merged),
  }
}
