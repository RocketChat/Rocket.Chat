import { Box } from '@rocket.chat/fuselage';
import React, { ReactElement } from 'react';

import { useTranslation } from '../../../../contexts/TranslationContext';
import NotAvailableContent from './NotAvailableContent';
import NotAvailableContentWrapper from './NotAvailableContentWrapper';

const NotAvailableOnCall = (): ReactElement => {
	const t = useTranslation();

	return (
		<Box h='44px' w='100%' borderColor='disabled' borderWidth='2px'>
			<NotAvailableContentWrapper>
				<NotAvailableContent icon='message' text={t('Composer_not_available_phone_calls')} />
			</NotAvailableContentWrapper>
		</Box>
	);
};

export default NotAvailableOnCall;
