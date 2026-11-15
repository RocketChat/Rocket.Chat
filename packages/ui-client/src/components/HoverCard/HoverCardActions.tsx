import { useToolbar } from '@react-aria/toolbar';
import { ButtonGroup, type ButtonGroupProps } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';
import { useRef } from 'react';

export type HoverCardActionsProps = {
	'aria-label': string;
	'children': ReactNode;
	'stretch'?: ButtonGroupProps['stretch'];
};

const HoverCardActions = ({ 'aria-label': ariaLabel, children, stretch }: HoverCardActionsProps) => {
	const ref = useRef<HTMLDivElement>(null);
	const { toolbarProps } = useToolbar({ 'aria-label': ariaLabel }, ref);

	return (
		<ButtonGroup ref={ref} small stretch={stretch} {...toolbarProps}>
			{children}
		</ButtonGroup>
	);
};

export default HoverCardActions;
