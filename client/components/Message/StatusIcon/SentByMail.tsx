import { Icon } from '@rocket.chat/fuselage';
import React, { FC, memo } from 'react';

import { useTranslation } from '../../../contexts/TranslationContext';

const SentByEmail: FC<{ size?: string }> = (props) => {
	const t = useTranslation();

	return <Icon name='mail' title={t('Message_sent_by_email')} {...props} />;
};

export default memo(SentByEmail);
