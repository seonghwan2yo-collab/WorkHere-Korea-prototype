import { ProfileAvatar, type ProfileAvatarSize } from './ProfileAvatar'
import { mergeProfileUser, profileDisplayName, profileStatusLabel, type ProfileUser } from './profileUtils'

type ProfileIdentityProps = {
  user?: ProfileUser
  fallback?: ProfileUser
  meta?: string
  size?: ProfileAvatarSize
  className?: string
}

export function ProfileIdentity({ user, fallback, meta, size = 'md', className = '' }: ProfileIdentityProps) {
  const profile = mergeProfileUser(user, fallback)
  return (
    <div className={`profile-identity ${className}`.trim()}>
      <ProfileAvatar {...profile} size={size} />
      <div className="profile-identity-copy">
        <strong>{profileDisplayName(profile)}</strong>
        <span className={`profile-status ${profileStatusLabel(profile) === '미인증' ? 'unverified' : 'verified'}`}>{profileStatusLabel(profile)}</span>
        {meta ? <small>{meta}</small> : null}
      </div>
    </div>
  )
}
