import { Box, Button, Dropdown, Icon } from '@rocket.chat/fuselage';
import { useLayout } from '@rocket.chat/ui-contexts';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import OngoingCalls from '../components/OngoingCalls/OngoingCalls';
import { useOngoingCallsList } from '../components/OngoingCalls/useOngoingCalls';
import { useDropdownVisibility } from '../views/room/Header/Omnichannel/QuickActions/hooks/useDropdownVisibility';

/**
 * Stands in for the sidebar's docked list of calls when there is no sidebar on screen.
 *
 * The calls have to be reachable wherever the user is, and a collapsed sidebar would otherwise hide the only
 * place they appear — including a call ringing right now. So the same list moves into a dropdown behind a button
 * in the navbar, unchanged: red while something is ringing, and it opens itself when a ring starts, because a
 * ringing call the user has to go looking for is a missed call.
 */
const NavBarItemOngoingCalls = () => {
	const { t } = useTranslation();
	const { sidebar } = useLayout();
	const { ringing, ongoing } = useOngoingCallsList();

	const reference = useRef<HTMLButtonElement>(null);
	const target = useRef(null);
	const { isVisible, toggle } = useDropdownVisibility({ reference, target });

	// Only when this button is the place the calls live: with the sidebar showing, they are already in it.
	const standsIn = sidebar.isCollapsed;
	const isRinging = ringing.length > 0;

	const wasRinging = useRef(false);

	useEffect(() => {
		if (standsIn && isRinging && !wasRinging.current) {
			toggle(true);
		}

		wasRinging.current = isRinging;
	}, [isRinging, standsIn, toggle]);

	if (!standsIn || ringing.length + ongoing.length === 0) {
		return null;
	}

	const total = ringing.length + ongoing.length;
	const label = isRinging ? `${t('__count__ringing', { count: ringing.length })} · ${total}` : t('__count__ongoing', { count: total });

	return (
		<>
			<Button ref={reference} small danger={isRinging} primary={!isRinging} onClick={() => toggle()} title={label}>
				<Box display='flex' alignItems='center' style={{ gap: 4 }}>
					<Icon name='video' size='x16' />
					{label}
					<Icon name={isVisible ? 'chevron-up' : 'chevron-down'} size='x16' />
				</Box>
			</Button>
			{isVisible && (
				// Anchored to the button's own end, since it sits at the end of the navbar: a dropdown hanging off
				// the right of the window is a dropdown with its buttons outside it.
				<Dropdown reference={reference} ref={target} placement='bottom-end'>
					{/* The same surface the sidebar docks it on, so the list looks like itself wherever it turns up. */}
					<Box padding={12} width='x260' borderRadius='x8' backgroundColor='surface-tint'>
						<OngoingCalls />
					</Box>
				</Dropdown>
			)}
		</>
	);
};

export default NavBarItemOngoingCalls;
