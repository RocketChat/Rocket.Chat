import type { AriaAttributes, FocusEventHandler, KeyboardEventHandler, MouseEventHandler, ReactNode, RefAttributes } from 'react';

import { ariaAndDataAttributes } from '../../helpers/ariaAndDataAttributes';
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
	className?: string;
} & AriaAttributes;

function MultiSelectAnchor(props: MultiSelectAnchorProps) {
	return (
		<SelectFocus
			{...ariaAndDataAttributes(props)}
			last
			ref={props.ref}
			id={props.id}
			name={props.name}
			role={props.role}
			className={props.className}
			disabled={props.disabled}
			onClick={props.onClick}
			onBlur={props.onBlur}
			onKeyUp={props.onKeyUp}
			onKeyDown={props.onKeyDown}
		>
			{props.children}
		</SelectFocus>
	);
}

export default MultiSelectAnchor;
