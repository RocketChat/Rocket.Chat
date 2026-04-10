import type { AriaButtonProps } from '@react-aria/button';
import type { OverlayTriggerState } from '@react-stately/overlays';
import type { MutableRefObject, UIEvent } from 'react';
import { createContext } from 'react';

export type UserCardContextValue = {
	openUserCard: (e: UIEvent, username: string) => void;
	closeUserCard: () => void;
	triggerProps: AriaButtonProps<'button'>;
	triggerRef: MutableRefObject<Element | null>;
	state: OverlayTriggerState;
};

export const UserCardContext = createContext<UserCardContextValue>({
	openUserCard: () => undefined,
	closeUserCard: () => undefined,
	triggerProps: {},
	triggerRef: { current: null },
	state: { isOpen: false, setOpen: () => undefined, open: () => undefined, close: () => undefined, toggle: () => undefined },
});
