import { Badge, Box, IconButton } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';

type CallBarActionProps = {
	label: string;
	pressed?: boolean;
	onClick: () => void;
	icon: ComponentProps<typeof IconButton>['icon'];
	/** Unread count surfaced on the action, e.g. messages that arrived while the chat panel was closed. */
	badgeCount?: number;
};

const CallBarAction = ({ label, icon, pressed, onClick, badgeCount = 0 }: CallBarActionProps) => (
	<Box position='relative' display='flex'>
		<IconButton medium icon={icon} title={label} aria-label={label} pressed={pressed} onClick={onClick} />
		{badgeCount > 0 && (
			<Box position='absolute' insetBlockStart={-4} insetInlineEnd={-4} pointerEvents='none'>
				<Badge variant='danger'>{badgeCount}</Badge>
			</Box>
		)}
	</Box>
);

export default CallBarAction;
