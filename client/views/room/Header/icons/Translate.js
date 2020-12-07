import React, { memo } from 'react';
import colors from '@rocket.chat/fuselage-tokens/colors';

import { useSetting } from '../../../../contexts/SettingsContext';
import { useTranslation } from '../../../../contexts/TranslationContext';
import Header from '../../../../components/Header';


const Translate = ({ room: { autoTranslateLanguage, autoTranslate } }) => {
	const t = useTranslation();
	const autoTranslateEnabled = useSetting('AutoTranslate_Enabled');
	const encryptedLabel = t('Translated');
	return autoTranslateEnabled && autoTranslate && autoTranslateLanguage ? <Header.State title={encryptedLabel} icon='language' color={colors.b500} tiny ghost/> : null;
};

export default memo(Translate);
