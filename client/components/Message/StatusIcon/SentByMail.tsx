import React, { FC, memo } from 'react';
import { Icon } from '@rocket.chat/fuselage';

import { useTranslation } from '../../../contexts/TranslationContext';


const SentByEmail: FC = () => {
	const t = useTranslation();

	return <Icon name='mail' title={t('Message_sent_by_email')} />;
};

export default memo(SentByEmail);
