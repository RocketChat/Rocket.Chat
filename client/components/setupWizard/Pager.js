import React from 'react';

import { useTranslation } from '../../hooks/useTranslation';
import { Button } from '../basic/Button';

const Footer = (props) => <footer className='setup-wizard-forms__footer' {...props} />;

export function Pager({ disabled, onBackClick, onContinueClick }) {
	const t = useTranslation();

	return <Footer>
		{onBackClick ? <Button secondary disabled={disabled} onClick={onBackClick}>
			{t('Back')}
		</Button> : null}
		<Button submit primary disabled={!onContinueClick || disabled} onClick={onContinueClick || null}>
			{t('Continue')}
		</Button>
	</Footer>;
}
