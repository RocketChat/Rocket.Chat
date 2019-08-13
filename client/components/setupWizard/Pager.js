import React from 'react';

import { useTranslation } from '../../hooks/useTranslation';
import { Button } from '../basic/Button';

import './Pager.css';

export function Pager({ disabled, onBackClick, onContinueClick }) {
	const t = useTranslation();

	return <footer className='Pager'>
		{onBackClick ? <Button secondary disabled={disabled} onClick={onBackClick}>
			{t('Back')}
		</Button> : null}
		<Button submit primary disabled={!onContinueClick || disabled} onClick={onContinueClick || null}>
			{t('Continue')}
		</Button>
	</footer>;
}
