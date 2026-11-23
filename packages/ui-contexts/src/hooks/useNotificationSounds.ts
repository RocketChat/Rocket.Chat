import { useContext } from 'react';

import type { NotificationSoundsContextValue } from '../NotificationSoundsContext.js';
import { NotificationSoundsContext } from '../NotificationSoundsContext.js';

export const useNotificationSounds = (): NotificationSoundsContextValue => useContext(NotificationSoundsContext);
