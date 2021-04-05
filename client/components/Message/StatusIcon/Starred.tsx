import React, { FC, memo } from 'react';
import { Icon } from '@rocket.chat/fuselage';

import { useTranslation } from '../../../contexts/TranslationContext';


const Starred: FC = () => {
	const t = useTranslation();

	return <Icon name='star' title={t('Message_has_been_starred')} />;
};

export default memo(Starred);
