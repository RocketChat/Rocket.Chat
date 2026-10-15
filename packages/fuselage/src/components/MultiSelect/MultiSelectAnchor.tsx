import type { AriaAttributes, FocusEventHandler, KeyboardEventHandler, MouseEventHandler, ReactNode, RefAttributes } from 'react';

import SelectFocus from '../Select/SelectFocus';

type MultiSelectAnchorProps = RefAttributes<Element> & {
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

function MultiSelectAnchor(props: MultiSelectAnchorProps) {
	return <SelectFocus rcx-input-box--undecorated order={1} {...props} />;
}

export default MultiSelectAnchor;
