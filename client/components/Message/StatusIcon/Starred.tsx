import { Icon } from '@rocket.chat/fuselage';
import React, { FC, memo } from 'react';

import { useTranslation } from '../../../contexts/TranslationContext';

const Starred: FC<{ size?: string }> = (props) => {
	const t = useTranslation();

	return <Icon name='star' title={t('Message_has_been_starred')} {...props} />;
};

export default memo(Starred);
