import { Icon } from '@rocket.chat/fuselage';
import React, { FC, memo } from 'react';

import { AutoTranslate } from '../../../../app/autotranslate/client';
import { IMessage } from '../../../../definition/IMessage';
import { useTranslation } from '../../../contexts/TranslationContext';

type TranslatedType = FC<{
	msg: IMessage;
	size?: string;
}>;

const Translated: TranslatedType = ({ msg, ...props }) => {
	const t = useTranslation();
	const { autoTranslateFetching, translationProvider } = msg;
	return (
		<Icon
			name='language'
			data-title={
				translationProvider && AutoTranslate.providersMetadata[translationProvider]?.displayName
			}
			className={autoTranslateFetching ? 'loading' : ''}
			title={t('Translated')}
			{...props}
		/>
	);
};

export default memo(Translated);
