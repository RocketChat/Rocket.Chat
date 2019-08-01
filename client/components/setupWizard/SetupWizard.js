import React from 'react';

import { ParametersProvider } from './ParametersProvider';
import { StateChecker } from './StateChecker';
import { Steps } from './Steps';
import { StepsState } from './StepsState';
import './SetupWizard.css';

export function SetupWizard() {
	return <StateChecker>
		<ParametersProvider>
			<StepsState>
				<div className='setup-wizard SetupWizard'>
					<Steps />
				</div>
			</StepsState>
		</ParametersProvider>
	</StateChecker>;
}
