import { Box } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

import { useTranslation } from '../../../contexts/TranslationContext';
import { PhoneNumberDisplay } from './PhoneNumberDisplay';

const CallerInfo: FC<{ callerData: any }> = ({ callerData }) => {
	const { callerId } = callerData;
	const t = useTranslation();

	return (
		<Box>
			<PhoneNumberDisplay phoneNumber={callerId} />
			<Box color='neutral-500-50'>{t('Calling')}</Box>
		</Box>
	);
};

export default CallerInfo;
