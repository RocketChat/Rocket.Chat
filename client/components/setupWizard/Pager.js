import React from 'react';
import { Button } from '@rocket.chat/fuselage';

import { useTranslation } from '../../hooks/useTranslation';

import './Pager.css';

export function Pager({ disabled, onBackClick, isContinueEnabled = true }) {
	const t = useTranslation();

	return <footer className='Pager'>
		{onBackClick ? <Button type='button' disabled={disabled} onClick={onBackClick}>
			{t('Back')}
		</Button> : null}
		<Button type='submit' primary disabled={!isContinueEnabled || disabled}>
			{t('Continue')}
		</Button>
	</footer>;
}
