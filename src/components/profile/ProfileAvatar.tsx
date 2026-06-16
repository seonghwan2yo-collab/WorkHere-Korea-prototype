import { UserRound } from 'lucide-react'
import { useState, type CSSProperties } from 'react'
import { isProfileVerified, profileInitial, type ProfileUser } from './profileUtils'
import { assetUrl } from '../../utils/assetUrl'

export type ProfileAvatarSize = 'sm' | 'md' | 'lg' | 'xl'

type ProfileAvatarProps = ProfileUser & {
  size?: ProfileAvatarSize
}

function avatarIconSize(size: ProfileAvatarSize) {
  if (size === 'xl') return 34
  if (size === 'lg') return 25
  if (size === 'sm') return 17
  return 21
}

export function ProfileAvatar({ size = 'md', ...user }: ProfileAvatarProps) {
  const [imageFailed, setImageFailed] = useState(false)
  const verified = isProfileVerified(user)
  const gradientColors = verified ? user.gradientColors || ['#0B4A8B', '#2BB8A4'] : ['#98A2B3', '#D0D5DD']
  const hasAvatar = Boolean(user.avatarUrl) && !imageFailed

  return (
    <span
      className={`profile-avatar profile-avatar-${size} ${verified ? 'verified' : 'unverified'} ${hasAvatar ? 'has-image' : 'no-image'}`}
      style={{ '--avatar-ring-start': gradientColors[0], '--avatar-ring-end': gradientColors[1] } as CSSProperties & Record<string, string>}
      aria-label={`${user.displayName || user.username || '사용자'} 프로필`}
    >
      <span className="profile-avatar-core">
        {hasAvatar ? (
          <img className="profile-avatar-image" src={assetUrl(user.avatarUrl)} alt="" loading="lazy" decoding="async" onError={() => setImageFailed(true)} />
        ) : (
          <span className="profile-avatar-initial">{profileInitial(user) || <UserRound size={avatarIconSize(size)} />}</span>
        )}
      </span>
      {verified ? (
        <span className="profile-flag-badge" aria-label={`${user.countryName || '국가'} 인증 배지`}>
          {user.flagIconUrl ? <img src={assetUrl(user.flagIconUrl)} alt="" loading="lazy" decoding="async" /> : <span>{user.flagEmoji || '✓'}</span>}
        </span>
      ) : null}
    </span>
  )
}
