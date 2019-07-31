import React from 'react';

import { ParametersProvider } from './ParametersProvider';
import { StateChecker } from './StateChecker';
import { Steps } from './Steps';
import { StepsState } from './StepsState';

export function SetupWizard() {
	return <StateChecker>
		<ParametersProvider>
			<StepsState>
				<div className='setup-wizard'>
					<Steps />
				</div>
			</StepsState>
		</ParametersProvider>
	</StateChecker>;
}
