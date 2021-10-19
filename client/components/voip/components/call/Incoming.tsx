import { Box } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

import { useTranslation } from '../../../../contexts/TranslationContext';
import RoomAvatar from '../../../avatar/RoomAvatar';

const Incoming: FC<{ callData: any }> = ({ callData }) => {
	const { type, value } = callData;
	const t = useTranslation();

	return (
		<Box>
			<RoomAvatar size={36} room={{ type, _id: value }} />
			<Box>
				{/* <PhoneNumber number={number} /> */}
				<Box>{t('color')}</Box>
			</Box>
			{/* <CallControls room={callData} /> */}
		</Box>
	);
};

export default Incoming;
