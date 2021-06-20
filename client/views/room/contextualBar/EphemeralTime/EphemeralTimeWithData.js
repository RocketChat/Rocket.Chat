import { Box, Divider } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React from 'react';

import VerticalBar from '../../../../components/VerticalBar';
import { useTranslation } from '../../../../contexts/TranslationContext';
import { useUserRoom } from '../../../../contexts/UserContext';
import { useFormatDateAndTime } from '../../../../hooks/useFormatDateAndTime';

const EphemeralTimeModal = ({ rid, tabBar }) => {
	const handleClose = useMutableCallback(() => tabBar && tabBar.close());
	const t = useTranslation();
	const room = useUserRoom(rid);
	const formatDateAndTime = useFormatDateAndTime();
	console.log(room);
	const { ephemeralTime } = room;
	return (
		<>
			<VerticalBar.Header>
				<VerticalBar.Text>{t('Ephemeral_time')}</VerticalBar.Text>
				{handleClose && <VerticalBar.Close onClick={handleClose} />}
			</VerticalBar.Header>
			<VerticalBar.ScrollableContent>
				<Box>
					<Box fontScale='p2' fontWeight='700' mb='x2'>
						Room Ephmeral Time
					</Box>
					<Divider />
					<Box>{formatDateAndTime(ephemeralTime)}</Box>
				</Box>
			</VerticalBar.ScrollableContent>
		</>
	);
};

export default EphemeralTimeModal;
