import { Button, Icon } from '@rocket.chat/fuselage';
import React from 'react';

import { useTranslation } from '../../../contexts/TranslationContext';

function ResetSettingButton(props) {
	const t = useTranslation();

	return (
		<Button aria-label={t('Reset')} danger ghost small title={t('Reset')} style={{ padding: 0 }} {...props}>
			<Icon name='undo' />
		</Button>
	);
}

export default ResetSettingButton;
