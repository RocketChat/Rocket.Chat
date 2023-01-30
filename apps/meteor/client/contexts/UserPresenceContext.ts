import { createContext } from 'react';

import type { Subscribable } from '../definitions/Subscribable';
import type { UserPresence } from '../lib/presence';

type UserPresenceContextValue = {
	queryUserData: (uid: string) => Subscribable<UserPresence | undefined>;
};

export const UserPresenceContext = createContext<UserPresenceContextValue | undefined>(undefined);
