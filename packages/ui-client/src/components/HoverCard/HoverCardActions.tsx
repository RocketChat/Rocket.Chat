import { useToolbar } from '@react-aria/toolbar';
import { ButtonGroup } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';
import { useRef } from 'react';

export type HoverCardActionsProps = {
	'aria-label': string;
	'children': ReactNode;
};

const HoverCardActions = ({ 'aria-label': ariaLabel, children }: HoverCardActionsProps) => {
	const ref = useRef<HTMLDivElement>(null);
	const { toolbarProps } = useToolbar({ 'aria-label': ariaLabel }, ref);

	return (
		<ButtonGroup ref={ref} small {...toolbarProps}>
			{children}
		</ButtonGroup>
	);
};

export default HoverCardActions;
