import { css } from '@rocket.chat/css-in-js';
import { Box, Palette } from '@rocket.chat/fuselage';
import type { MouseEvent, ReactNode } from 'react';

const itemStyle = css`
	&:hover,
	&:focus-within {
		background-color: ${Palette.surface['surface-hover'].toString()};
	}
`;

/**
 * The title is the link, and its `::after` covers the row. Only the title is inside the anchor, so the anchor's
 * name is the call's name and the row's own buttons are not nested in a link.
 */
// The focus ring goes on the row overlay, not on the title's few characters. Fuselage's focused-link rule
// paints an outline, a box-shadow and a colour, so all three are cleared on the anchor itself.
const titleLinkStyle = css`
	min-width: 0;
	text-decoration: none;
	color: inherit;

	&::after {
		position: absolute;
		inset: 0;
		content: '';
	}

	&:focus-visible {
		color: inherit;
		outline: none;
		box-shadow: none;
	}

	&:focus-visible::after {
		outline: 2px solid ${Palette.stroke['stroke-highlight'].toString()};
		outline-offset: -2px;
	}
`;

/** Above the title's `::after`, so a click on a button is a click on that button. */
const actionsStyle = css`
	position: relative;
`;

export type OngoingCallItemProps = {
	/** Where the call is, so the row is a real link: it can be opened in a tab of its own, and it has a name. */
	href: string;
	icon?: ReactNode;
	title: ReactNode;
	subtitle?: ReactNode;
	/** What goes at the end of the first row: when the call happened, or "Ringing…". Already said, not a date. */
	time?: ReactNode;
	/** Buttons of the row's own, beside the subtitle rather than inside the link. */
	actions?: ReactNode;
	onOpen: () => void;
};

const OngoingCallItem = ({ href, icon, title, subtitle, time, actions, onOpen }: OngoingCallItemProps) => {
	// Not followed — the call opens in its own window — but still a link, so it can be opened in a tab of its own.
	const handleOpen = (event: MouseEvent) => {
		event.preventDefault();
		onOpen();
	};

	return (
		<Box className={itemStyle} position='relative' display='flex' flexDirection='column' paddingInline={16} paddingBlock={8}>
			<Box display='flex' alignItems='center' style={{ gap: 4 }}>
				{icon}
				<Box
					is='a'
					href={href}
					onClick={handleOpen}
					className={titleLinkStyle}
					withTruncatedText
					fontScale='p2m'
					color='default'
					flexGrow={1}
				>
					{title}
				</Box>
				{/* Against `undefined`, not for truth: an empty string or a 0 is still the caller asking for a slot. */}
				{time !== undefined && (
					<Box fontScale='c1' color='hint' flexShrink={0}>
						{time}
					</Box>
				)}
			</Box>
			<Box display='flex' alignItems='center' style={{ gap: 4 }}>
				<Box flexGrow={1} minWidth={0}>
					{subtitle}
				</Box>
				{actions && (
					<Box className={actionsStyle} display='flex' alignItems='center' flexShrink={0} style={{ gap: 4 }}>
						{actions}
					</Box>
				)}
			</Box>
		</Box>
	);
};

export default OngoingCallItem;
