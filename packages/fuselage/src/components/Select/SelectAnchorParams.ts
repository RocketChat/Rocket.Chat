import type { FocusEventHandler, KeyboardEventHandler, MouseEventHandler, ReactNode, Ref } from 'react';

export type SelectAnchorParams = {
	ref: Ref<HTMLInputElement>;
	children: ReactNode;
	disabled: boolean;
	onClick: MouseEventHandler;
	onBlur: FocusEventHandler;
	onKeyUp: KeyboardEventHandler;
	onKeyDown: KeyboardEventHandler;
};
