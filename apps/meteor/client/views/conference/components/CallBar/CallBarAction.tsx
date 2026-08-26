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
	/**
	 * What the badge means, said in words — "3 unread messages". It is the badge's accessible form as well as its
	 * tooltip: the bare number is otherwise announced beside the button as a stray "3".
	 */
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
}: CallBarActionProps) => {
	const badged = badgeCount > 0 || badgeDot;

	return (
		<Box position='relative' display='flex'>
			<IconButton
				large
				icon={icon}
				title={label}
				// The badge is hidden from assistive technology and folded in here instead, so the count is announced
				// as part of the action rather than as a number loose beside it.
				aria-label={badged && badgeTitle ? `${label}, ${badgeTitle}` : label}
				onClick={onClick}
				// `pressed` is what the open-panel styling is drawn from, so it is a toggle state and has to be
				// reported as one. Omitted entirely when the caller passes nothing: a plain action is not a toggle.
				{...(pressed !== undefined && { 'aria-pressed': pressed })}
				{...(pressed ? { info: true } : {})}
			/>
			{badgeCount > 0 && (
				<Box position='absolute' insetBlockStart={-4} insetInlineEnd={-4} pointerEvents='none' aria-hidden='true'>
					<Badge variant={badgeVariant} title={badgeTitle}>
						{badgeCount}
					</Badge>
				</Box>
			)}
			{badgeCount === 0 && badgeDot && (
				<Box position='absolute' insetBlockStart={-2} insetInlineEnd={-2} pointerEvents='none' aria-hidden='true'>
					<Badge variant={badgeVariant} title={badgeTitle} />
				</Box>
			)}
		</Box>
	);
};

export default CallBarAction;
