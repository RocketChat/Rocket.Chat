import { memo, type ReactNode } from 'react';

import { WizardContext } from './WizardContext';
import type { WizardAPI } from './WizardContext';

type WizardProps = {
	api: WizardAPI;
	children: ReactNode;
};

const Wizard = ({ children, api }: WizardProps) => (
	<WizardContext.Provider value={api}>
		<div className='steps-wizard'>{children}</div>
	</WizardContext.Provider>
);

export default memo(Wizard);
