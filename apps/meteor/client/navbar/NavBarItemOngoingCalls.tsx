import { Badge, Box, Dropdown, IconButton } from '@rocket.chat/fuselage';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import OngoingCallsList from '../components/OngoingCalls/OngoingCallsList';
import { useOngoingCallsList } from '../components/OngoingCalls/useOngoingCalls';
import { useDropdownVisibility } from '../views/room/Header/Omnichannel/QuickActions/hooks/useDropdownVisibility';

const NavBarItemOngoingCalls = () => {
	const { t } = useTranslation();
	const { ringing, ongoing, declined } = useOngoingCallsList();

	const reference = useRef<HTMLButtonElement>(null);
	const target = useRef(null);
	const { isVisible, toggle } = useDropdownVisibility({ reference, target });

	const isRinging = ringing.length > 0;
	const isOffering = isRinging || ongoing.length > 0;

	const ringingCount = ringing.length;
	const prevRingingCount = useRef(0);

	useEffect(() => {
		if (ringingCount > prevRingingCount.current) {
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
			<Box position='relative' display='inline-flex'>
				<IconButton
					ref={reference}
					small
					secondary={isOffering}
					danger={isRinging}
					info={isOffering && !isRinging}
					onClick={() => toggle()}
					title={name}
					// The badge sits beside the button rather than inside it, so a screen reader would otherwise announce
					// the name and then a stray number. The count goes into the name and the badge is hidden from
					// assistive technology, so it is said once.
					aria-label={active > 0 ? t('Ongoing_calls_count', { count: active }) : name}
					icon='video'
				/>
				{active > 0 && (
					<Badge aria-hidden='true' variant='secondary' style={{ position: 'absolute', insetBlockStart: -4, insetInlineEnd: -4 }}>
						{active}
					</Badge>
				)}
			</Box>
			{isVisible && (
				<Dropdown reference={reference} ref={target} placement='bottom-end'>
					{/* Named, so the calls in it are reachable as a group rather than as loose rows in an unnamed box. */}
					<Box role='region' aria-label={name} paddingBlock={8} width='x280' borderRadius='x8' backgroundColor='surface-light'>
						<OngoingCallsList />
					</Box>
				</Dropdown>
			)}
		</>
	);
};

export default NavBarItemOngoingCalls;
