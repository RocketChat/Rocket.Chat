import type { AriaAttributes, FocusEventHandler, KeyboardEventHandler, MouseEventHandler, ReactNode, RefAttributes } from 'react';

import { Box } from '../Box';

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
	return <Box rcx-select__focus rcx-select__focus--button is='button' type='button' rcx-input-box--undecorated order={1} {...props} />;
}

export default MultiSelectAnchor;
