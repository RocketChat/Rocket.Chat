import { Box } from '@rocket.chat/fuselage';
import { memo } from 'react';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import { WizardContext } from './WizardContext.js';
import type { WizardAPI } from './WizardContext.js';

export type WizardProps = ComponentPropsWithoutRef<typeof Box> & {
	api: WizardAPI;
	children: ReactNode;
};

const Wizard = ({ children, api, ...props }: WizardProps) => (
	<WizardContext.Provider value={api}>
		<Box {...props}>{children}</Box>
	</WizardContext.Provider>
);

export default memo(Wizard);
