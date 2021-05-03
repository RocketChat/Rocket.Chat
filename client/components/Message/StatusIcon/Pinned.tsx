import { Icon } from '@rocket.chat/fuselage';
import React, { FC, memo } from 'react';

import { useTranslation } from '../../../contexts/TranslationContext';

const Pinned: FC<{ size?: string }> = (props) => {
	const t = useTranslation();

	return <Icon name='pin' title={t('Message_has_been_pinned')} {...props} />;
};

export default memo(Pinned);
