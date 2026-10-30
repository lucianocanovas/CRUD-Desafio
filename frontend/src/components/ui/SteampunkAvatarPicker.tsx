import type { SteampunkAvatarId } from '../../models/user.model';
import { SteampunkAvatar3D } from '../three/SteampunkAvatar3D';
import { STEAMPUNK_AVATARS } from '../three/steampunkAvatars';

interface SteampunkAvatarPickerProps {
  selectedId: SteampunkAvatarId;
  onSelect: (avatarId: SteampunkAvatarId) => void;
  disabled?: boolean;
  compact?: boolean;
}

export function SteampunkAvatarPicker({
  selectedId,
  onSelect,
  disabled = false,
  compact = false,
}: SteampunkAvatarPickerProps) {
  return (
    <div
      className={`psx-avatar-picker ${compact ? 'is-compact' : ''}`}
      role="radiogroup"
      aria-label="Seleccionar avatar"
    >
      <div className="psx-avatar-grid">
        {STEAMPUNK_AVATARS.map((avatar) => {
          const isSelected = avatar.id === selectedId;
          return (
            <button
              key={avatar.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={disabled}
              className={`psx-avatar-card ${isSelected ? 'selected' : ''}`}
              style={
                {
                  '--card-accent': avatar.accentColor,
                } as React.CSSProperties
              }
              onClick={() => onSelect(avatar.id)}
            >
              <div className="psx-card-viewport">
                <SteampunkAvatar3D
                  avatarId={avatar.id}
                  size={compact ? 'md' : 'lg'}
                  interactive
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
