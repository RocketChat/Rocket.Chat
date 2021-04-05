import React, { FC, memo } from 'react';
import { Icon } from '@rocket.chat/fuselage';

import { useTranslation } from '../../../contexts/TranslationContext';


const Pinned: FC = () => {
	const t = useTranslation();

	return <Icon name='pin' title={t('Message_has_been_pinned')} />;
};

export default memo(Pinned);
