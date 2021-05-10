import colors from '@rocket.chat/fuselage-tokens/colors';
import React, { FC, memo } from 'react';

import { IRoom } from '../../../../../definition/IRoom';
import Header from '../../../../components/Header';
import { useSetting } from '../../../../contexts/SettingsContext';
import { useTranslation } from '../../../../contexts/TranslationContext';

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
