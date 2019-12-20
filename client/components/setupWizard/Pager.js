import { Button, ButtonGroup } from '@rocket.chat/fuselage';
import React from 'react';

import { useTranslation } from '../../contexts/TranslationContext';

export function Pager({ disabled, onBackClick, isContinueEnabled = true }) {
	const t = useTranslation();

	return <ButtonGroup align='end'>
		{onBackClick ? <Button type='button' disabled={disabled} onClick={onBackClick} className='SetupWizard__back'>
			{t('Back')}
		</Button> : null}
		<Button type='submit' primary disabled={!isContinueEnabled || disabled} className='SetupWizard__continue'>
			{t('Continue')}
		</Button>
	</ButtonGroup>;
}
