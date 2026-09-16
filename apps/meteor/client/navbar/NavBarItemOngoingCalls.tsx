import { FocusScope } from '@react-aria/focus';
import { Box, Dropdown } from '@rocket.chat/fuselage';
import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import IconButtonWithBadge from '../components/IconButtonWithBadge';
import OngoingCallsList from '../components/OngoingCalls/OngoingCallsList';
import { useOngoingCallsList } from '../components/OngoingCalls/useOngoingCalls';
import { useDropdownVisibility } from '../views/room/Header/Omnichannel/QuickActions/hooks/useDropdownVisibility';

const NavBarItemOngoingCalls = () => {
	const { t } = useTranslation();
	const { ringing, ongoing, declined } = useOngoingCallsList();

	const reference = useRef<HTMLButtonElement>(null);
	const target = useRef(null);
	const { isVisible, toggle } = useDropdownVisibility({ reference, target });
	const listId = useId();

	// Whether this opening was asked for. The list also opens itself when a call starts ringing, and taking the
	// focus then would pull it out of whatever the user was in the middle of typing — a call arriving is news,
	// not an instruction to go and look at it.
	const [openedByUser, setOpenedByUser] = useState(false);

	const isRinging = ringing.length > 0;
	const isOffering = isRinging || ongoing.length > 0;

	const ringingCount = ringing.length;
	const prevRingingCount = useRef(0);

	useEffect(() => {
		if (ringingCount > prevRingingCount.current) {
			setOpenedByUser(false);
			toggle(true);
		}

		prevRingingCount.current = ringingCount;
	}, [ringingCount, toggle]);

	const active = ringing.length + ongoing.length;
	const total = active + declined.length;

	if (total === 0) {
		return null;
	}

	const name = t('Ongoing_calls');

	return (
		<>
			<Box display='inline-flex'>
				<IconButtonWithBadge
					ref={reference}
					small
					secondary={isOffering}
					danger={isRinging}
					info={isOffering && !isRinging}
					onClick={() => {
						setOpenedByUser(!isVisible);
						toggle();
					}}
					// What the button does to the page, said rather than implied: it opens the list below it, and the
					// list is a thing on the page with an id, so a reader can be told where it went and whether it is
					// open without being moved there.
					aria-expanded={isVisible}
					aria-controls={listId}
					title={name}
					// A screen reader would otherwise announce the name and then a stray number, so the count goes
					// into the name and the badge is hidden from assistive technology — said once.
					aria-label={active > 0 ? t('Ongoing_calls_count', { count: active }) : name}
					icon='video'
					badge={active > 0 ? active : undefined}
					badgeVariant='secondary'
				/>
			</Box>
			{isVisible && (
				<Dropdown reference={reference} ref={target} placement='bottom-end'>
					{/* Focus goes in when the user opens it and comes back to the button when it closes — without that
					    the list was openable from the keyboard and then unreachable, since it is portalled away from
					    the button in the DOM. Not `contain`: this is a disclosure rather than a dialog, so Tab may
					    leave it. */}
					<FocusScope restoreFocus autoFocus={openedByUser}>
						{/* Escape is how a thing that opened over the page is dismissed, and the button it came from is
						    where focus belongs afterwards — `restoreFocus` above puts it there. */}
						<Box
							id={listId}
							onKeyDown={(event) => {
								if (event.key !== 'Escape') {
									return;
								}

								event.stopPropagation();
								toggle(false);
								// Put back by hand rather than left to `restoreFocus`, which returns it to whatever had it
								// when the scope mounted — and on this path that is a button about to stop existing in the
								// reader's mental model of the page. Focus belongs on the control that closed it.
								reference.current?.focus();
							}}
							paddingBlock={8}
							width='x280'
							borderRadius='large'
							backgroundColor='surface-light'
						>
							<OngoingCallsList />
						</Box>
					</FocusScope>
				</Dropdown>
			)}
		</>
	);
};

export default NavBarItemOngoingCalls;
