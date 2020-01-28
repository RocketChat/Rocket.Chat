import React from 'react';

import { useWipeInitialPageLoading } from '../../hooks/useWipeInitialPageLoading';
import { ConnectionStatusAlert } from '../connectionStatus/ConnectionStatusAlert';
import { ParametersProvider } from './ParametersProvider';
import { StateChecker } from './StateChecker';
import { Steps } from './Steps';
import { StepsState } from './StepsState';
import './SetupWizard.css';

export function SetupWizard() {
	useWipeInitialPageLoading();

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
