import { Box } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

import { useTranslation } from '../../../contexts/TranslationContext';
import { PhoneNumberDisplay } from './PhoneNumberDisplay';

const CallerInfo: FC<{ callerData: any; data: any }> = ({ callerData, data }) => {
	const { callerId } = callerData;
	const { callTime } = data;
	const t = useTranslation();

	return (
		<Box>
			<PhoneNumberDisplay phoneNumber={callerId} />
			<Box color='neutral-500-50'>{callTime || t('Calling')}</Box>
		</Box>
	);
};

export default CallerInfo;
