import React from 'react';

import { useTranslation } from '../../hooks/useTranslation';
import './StepHeader.css';

const Container = (props) => <header className='SetupWizard__StepHeader' {...props} />;

const RunningHead = (props) => <p className='SetupWizard__StepHeader-runningHead' {...props} />;

const Title = (props) => <h2 className='SetupWizard__StepHeader-title' {...props} />;

export function StepHeader({ number, title }) {
	const t = useTranslation();

	return <Container>
		<RunningHead>{t('Step')} {number}</RunningHead>
		<Title>{title}</Title>
	</Container>;
}
