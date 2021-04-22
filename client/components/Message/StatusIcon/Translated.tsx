import { Icon } from '@rocket.chat/fuselage';
import React, { FC, memo } from 'react';

import { IMessage } from '../../../../definition/IMessage';
import { useTranslation } from '../../../contexts/TranslationContext';

type TranslatedType = FC<{
	msg: IMessage;
}>;

const Translated: TranslatedType = ({ msg }) => {
	const t = useTranslation();

	return (
		<Icon
			name='language'
			className={msg.autoTranslateFetching ? 'loading' : ''}
			title={t('Translated')}
		/>
	);
};

export default memo(Translated);
