import type { MutableRefObject, UIEvent } from 'react';
import { createContext, useContext } from 'react';
import type { AriaButtonProps } from 'react-aria';
import type { OverlayTriggerState } from 'react-stately';

type UserCardContextValue = {
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

export const useUserCard = () => useContext(UserCardContext);
