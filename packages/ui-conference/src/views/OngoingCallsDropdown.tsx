import { FocusScope } from '@react-aria/focus';
import { Box, Dropdown } from '@rocket.chat/fuselage';
import { useDropdownVisibility } from '@rocket.chat/ui-client';
import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import IconButtonWithBadge from '../components/IconButtonWithBadge';
import OngoingCallsList from '../components/OngoingCalls/OngoingCallsList';
import { useOngoingCalls } from '../context/OngoingCallsContext';

/**
 * The calls this user could walk into, behind one control — nothing at all while there are none.
 *
 * It is the whole disclosure and not just the list, because the two answer each other: the button's mark is the
 * count the list would show, and a call that starts ringing opens the list by itself.
 */
const OngoingCallsDropdown = () => {
	const { t } = useTranslation();
	const { ringing, ongoing, declined } = useOngoingCalls();

	// A click anywhere else closes the list — but not one on the button it hangs from, which has its own answer
	// to being clicked and would otherwise close and reopen it in the same gesture. The refs are the hook's, so
	// which one goes on the button and which on the list is not this file's to get right.
	const { isVisible, toggle, reference, target } = useDropdownVisibility<HTMLButtonElement>();
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

export default OngoingCallsDropdown;
