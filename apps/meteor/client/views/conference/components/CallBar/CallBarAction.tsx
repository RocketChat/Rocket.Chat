import { Badge, Box, IconButton } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';

type CallBarActionProps = {
	label: string;
	pressed?: boolean;
	onClick: () => void;
	icon: ComponentProps<typeof IconButton>['icon'];
	/** Surfaced on the action: how many people are in the call, or what is unread while the chat is closed. */
	badgeCount?: number;
	/**
	 * Defaults to `secondary`, because most counts are information rather than a problem. Unread messages pass
	 * the variant the sidebar would have used, so a mention reads as urgent in both places.
	 */
	badgeVariant?: ComponentProps<typeof Badge>['variant'];
	badgeTitle?: string;
};

const CallBarAction = ({ label, icon, pressed, onClick, badgeCount = 0, badgeVariant = 'secondary', badgeTitle }: CallBarActionProps) => (
	<Box position='relative' display='flex'>
		<IconButton medium icon={icon} title={label} aria-label={label} pressed={pressed} onClick={onClick} />
		{badgeCount > 0 && (
			<Box position='absolute' insetBlockStart={-4} insetInlineEnd={-4} pointerEvents='none'>
				<Badge variant={badgeVariant} title={badgeTitle}>
					{badgeCount}
				</Badge>
			</Box>
		)}
	</Box>
);

export default CallBarAction;
