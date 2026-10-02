import { Item, ItemActions, ItemContent, ItemDescription, ItemLink, ItemMeta, ItemRow, ItemTitle } from '@rocket.chat/fuselage';
import type { MouseEvent, ReactNode } from 'react';

export type OngoingCallItemProps = {
	/** Where the call is, so the row is a real link: it can be opened in a tab of its own, and it has a name. */
	href: string;
	icon?: ReactNode;
	title: ReactNode;
	subtitle?: ReactNode;
	/** What goes at the end of the first row: when the call happened, or "Ringing…". Already said, not a date. */
	time?: ReactNode;
	/** Buttons of the row's own, beside the link rather than inside it. */
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
		<Item size='extended' inset='md'>
			<ItemContent>
				<ItemRow>
					{icon}
					<ItemTitle>
						<ItemLink href={href} onClick={handleOpen}>
							{title}
						</ItemLink>
					</ItemTitle>
					{/* Against `undefined`, not for truth: an empty string or a 0 is still the caller asking for a slot. */}
					{time !== undefined && <ItemMeta>{time}</ItemMeta>}
				</ItemRow>
				{subtitle && <ItemDescription>{subtitle}</ItemDescription>}
			</ItemContent>
			{actions && <ItemActions>{actions}</ItemActions>}
		</Item>
	);
};

export default OngoingCallItem;
