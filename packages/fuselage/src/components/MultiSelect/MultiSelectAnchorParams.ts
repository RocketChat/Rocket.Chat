import type { AriaAttributes, FocusEventHandler, KeyboardEventHandler, MouseEventHandler, ReactNode, Ref } from 'react';

export type MultiSelectAnchorParams = {
	ref: Ref<HTMLInputElement>;
	children: ReactNode;
	disabled: boolean;
	onClick: MouseEventHandler;
	onBlur: FocusEventHandler;
	onKeyUp: KeyboardEventHandler;
	onKeyDown: KeyboardEventHandler;
	role?: string;
	id?: string;
	name?: string;
} & AriaAttributes;
