import { useContext } from 'react';

import type { NotificationSoundsContextValue } from '../NotificationSoundsContext';
import { NotificationSoundsContext } from '../NotificationSoundsContext';

export const useNotificationSounds = (): NotificationSoundsContextValue => useContext(NotificationSoundsContext);
