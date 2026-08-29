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
	/** Show a small dot badge instead of a count. Takes precedence when `badgeCount` is 0. */
	badgeDot?: boolean;
};

const CallBarAction = ({
	label,
	icon,
	pressed,
	onClick,
	badgeCount = 0,
	badgeVariant = 'secondary',
	badgeTitle,
	badgeDot,
}: CallBarActionProps) => (
	<Box position='relative' display='flex'>
		<IconButton large icon={icon} title={label} aria-label={label} onClick={onClick} {...(pressed ? { info: true } : {})} />
		{badgeCount > 0 && (
			<Box position='absolute' insetBlockStart={-4} insetInlineEnd={-4} pointerEvents='none'>
				<Badge variant={badgeVariant} title={badgeTitle}>
					{badgeCount}
				</Badge>
			</Box>
		)}
		{badgeCount === 0 && badgeDot && (
			<Box position='absolute' insetBlockStart={-2} insetInlineEnd={-2} pointerEvents='none'>
				<Badge variant={badgeVariant} title={badgeTitle} />
			</Box>
		)}
	</Box>
);

export default CallBarAction;
