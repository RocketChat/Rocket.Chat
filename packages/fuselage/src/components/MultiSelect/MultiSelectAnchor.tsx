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
	return <Box fontScale='p2m' color='hint' rcx-select__focus is='button' type='button' rcx-input-box--undecorated order={1} {...props} />;
}

export default MultiSelectAnchor;
