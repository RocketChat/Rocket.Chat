import React from 'react';

import { ParametersProvider } from './ParametersProvider';
import { StateChecker } from './StateChecker';
import { Steps } from './Steps';
import { StepsState } from './StepsState';
import { ConnectionStatusAlert } from '../connectionStatus/ConnectionStatusAlert';
import './SetupWizard.css';

export function SetupWizard() {
	return <>
		<ConnectionStatusAlert />
		<StateChecker>
			<ParametersProvider>
				<StepsState>
					<div className='SetupWizard'>
						<Steps />
					</div>
				</StepsState>
			</ParametersProvider>
		</StateChecker>
	</>;
}
