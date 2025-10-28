import type { IRoom } from '@rocket.chat/core-typings';
import { useSetting } from '@rocket.chat/ui-contexts';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { HeaderState } from '../../../../components/Header';

type TranslateProps = {
	room: IRoom;
};

const Translate = ({ room: { autoTranslateLanguage, autoTranslate } }: TranslateProps) => {
	const { t } = useTranslation();
	const autoTranslateEnabled = useSetting('AutoTranslate_Enabled');
	const encryptedLabel = t('Translated');
	return autoTranslateEnabled && autoTranslate && autoTranslateLanguage ? (
		<HeaderState title={encryptedLabel} icon='language' color='info' />
	) : null;
};

export default memo(Translate);
