import React from 'react';

import { SetupWizardSideBar } from './SetupWizardSideBar';
import { SetupWizardForm } from './SetupWizardForm';
import { SetupWizardState } from './SetupWizardState';

export function SetupWizard() {
	return <SetupWizardState>
		<div className='setup-wizard'>
			<SetupWizardSideBar />
			<SetupWizardForm />
		</div>
	</SetupWizardState>;
}
