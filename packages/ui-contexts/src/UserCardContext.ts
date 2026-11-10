import type { AriaAttributes, UIEvent } from 'react';
import { createContext } from 'react';

export type UserCardContextValue = {
	openUserCard: (e: UIEvent, username: string) => void;
	openUserInfo: (username: string) => void;
	closeUserCard: () => void;
	/**
	 * Static ARIA attributes for user card triggers. Deliberately carries no
	 * per-render state (aria-expanded/aria-controls): a single provider serves
	 * every trigger in the room, so stateful attributes would be announced on
	 * all of them whenever any card opens.
	 */
	triggerProps: AriaAttributes;
};

export const UserCardContext = createContext<UserCardContextValue>({
	openUserCard: () => undefined,
	openUserInfo: () => undefined,
	closeUserCard: () => undefined,
	triggerProps: {},
});
