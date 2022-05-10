import type { IRoom } from '@rocket.chat/core-typings';
import colors from '@rocket.chat/fuselage-tokens/colors';
import { useSetting, useTranslation } from '@rocket.chat/ui-contexts';
import React, { FC, memo } from 'react';

import Header from '../../../../components/Header';

type TranslateProps = {
	room: IRoom;
};

const Translate: FC<TranslateProps> = ({ room: { autoTranslateLanguage, autoTranslate } }) => {
	const t = useTranslation();
	const autoTranslateEnabled = useSetting('AutoTranslate_Enabled');
	const encryptedLabel = t('Translated');
	return autoTranslateEnabled && autoTranslate && autoTranslateLanguage ? (
		<Header.State title={encryptedLabel} icon='language' color={colors.b500} />
	) : null;
};

export default memo(Translate);
