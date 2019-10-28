import { Text } from '@rocket.chat/fuselage';
import React from 'react';

import { Icon } from '../../basic/Icon';
import { useTranslation } from '../../providers/TranslationProvider';

export function ResetSettingButton({ onClick }) {
	const t = useTranslation();

	return <Text
		aria-label={t('Reset')}
		dangerColor
		title={t('Reset')}
		onClick={onClick}
	>
		<Icon icon='icon-ccw' />
	</Text>;
}
