import React from 'react';

import { ParametersProvider } from './ParametersProvider';
import { StateChecker } from './StateChecker';
import { StepsState } from './StepsState';
import { SetupWizardPage } from './SetupWizardPage';

export function SetupWizardRoute() {
	return <StateChecker>
		<ParametersProvider>
			<StepsState>
				<SetupWizardPage />
			</StepsState>
		</ParametersProvider>
	</StateChecker>;
}
