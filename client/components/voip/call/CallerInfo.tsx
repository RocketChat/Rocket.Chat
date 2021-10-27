import { Box } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

import { useTranslation } from '../../../contexts/TranslationContext';
import { PhoneNumberDisplay } from './PhoneNumberDisplay';

const CallerInfo: FC<{ callerData: any }> = ({ callerData }) => {
	const { callerId } = callerData;
	const t = useTranslation();

	return (
		<Box>
			<Box>
				<PhoneNumberDisplay phoneNumber={callerId} />
				<Box color='neutral-500-50'>{t('Calling' as 'color')}</Box>
			</Box>
		</Box>
	);
};

export default CallerInfo;
