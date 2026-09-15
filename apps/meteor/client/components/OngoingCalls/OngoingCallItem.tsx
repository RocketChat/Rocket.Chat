import { css } from '@rocket.chat/css-in-js';
import { Box, Palette } from '@rocket.chat/fuselage';
import type { MouseEvent, ReactNode } from 'react';

import { useShortTimeAgo } from '../../hooks/useTimeAgo';

/**
 * A row in a dropdown, not in the sidebar — which is what this used to borrow.
 *
 * Laid out in two rows the way `Extended` lays out a sidebar row, because that is the shape the design asks for:
 * an icon and a title on the first, with the time at its end; whatever else there is to say on the second, with
 * the row's own buttons at its end. Each row ends where the other does, so the times of neighbouring calls line
 * up whether or not there is a button beneath them.
 *
 * What it does not borrow is the sidebar item itself, whose business is selection, indent levels and a deferred
 * kebab menu — none of which a list of calls has, and all of which had to be worked around. The one that
 * mattered: `SidebarItem` is a single anchor wrapping everything, so the row's own buttons ended up inside a
 * link. That is invalid HTML, it left the buttons unreachable as themselves, and it is why a click on one had to
 * be undone at the top with `closest('button')`.
 *
 * It is a row and not a list item: which list it sits in, and whether it sits in one at all, is the list's own
 * business — and a `<li>` rendered outside a `<ul>` is a violation its own story would report.
 */
const itemStyle = css`
	&:hover,
	&:focus-within {
		background-color: ${Palette.surface['surface-hover'].toString()};
	}
`;

/**
 * The title is the link, and the link covers the row.
 *
 * Only the title is inside the anchor, so the anchor's name is the call's name and nothing else is nested in it.
 * The `::after` is what makes the whole row clickable — the buttons sit above it, so they are still themselves —
 * and it is also what the focus ring is drawn on, since the row is what the link reaches.
 */
const titleLinkStyle = css`
	min-width: 0;
	text-decoration: none;
	color: inherit;

	&::after {
		position: absolute;
		inset: 0;
		content: '';
	}

	/* The ring goes on the row, not on the words: the anchor's own box is the title's few characters, and framing
	   that as well drew a second, smaller frame inside the first. Fuselage's own rule for a focused link paints
	   both an outline and a box-shadow, so both have to go — and losing them is only safe because the rule below
	   replaces them, on the overlay that covers the whole row. */
	&:focus-visible {
		/* The same rule recolours the text, which would make a focused title the only blue one in the list. */
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
	time?: Date;
	/**
	 * Said in the timestamp's place, when the row has something more useful to put there than when it happened —
	 * a call that is ringing right now, say. Wins over `time`.
	 */
	timeLabel?: ReactNode;
	/** Buttons of the row's own, beside the subtitle rather than inside the link. */
	actions?: ReactNode;
	onOpen: () => void;
};

const OngoingCallItem = ({ href, icon, title, subtitle, time, timeLabel, actions, onOpen }: OngoingCallItemProps) => {
	const formatDate = useShortTimeAgo();

	// The call opens in its own window, so the link is not followed — but it stays a link, which is what makes
	// the row reachable by keyboard, nameable, and openable in a tab of its own with the middle button.
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
				{/* A node, so an empty string or a 0 is still the caller saying "put this here" — which is what
				    `timeLabel ?? formatDate(time)` honours. Testing it for truth would fall back to the timestamp for
				    those, and render neither. */}
				{(timeLabel !== undefined || time) && (
					<Box fontScale='c1' color='hint' flexShrink={0}>
						{timeLabel ?? (time && formatDate(time))}
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
