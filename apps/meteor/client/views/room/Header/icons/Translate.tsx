import type { IRoom } from '@rocket.chat/core-typings';
import { HeaderState } from '@rocket.chat/ui-client';
import { useSetting, useTranslation } from '@rocket.chat/ui-contexts';
import type { FC } from 'react';
import React, { memo } from 'react';

type TranslateProps = {
	room: IRoom;
};

const Translate: FC<TranslateProps> = ({ room: { autoTranslateLanguage, autoTranslate } }) => {
	const t = useTranslation();
	const autoTranslateEnabled = useSetting('AutoTranslate_Enabled');
	const encryptedLabel = t('Translated');
	return autoTranslateEnabled && autoTranslate && autoTranslateLanguage ? (
		<HeaderState title={encryptedLabel} icon='language' color='info' />
	) : null;
};

export default memo(Translate);
