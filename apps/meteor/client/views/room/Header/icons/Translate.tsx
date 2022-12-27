import type { IRoom } from '@rocket.chat/core-typings';
import colors from '@rocket.chat/fuselage-tokens/colors';
import { Header } from '@rocket.chat/ui-client';
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
		<Header.State title={encryptedLabel} icon='language' color={colors.p500} />
	) : null;
};

export default memo(Translate);
