import type { ReactNode } from 'react';

import * as FormPageLayout from '../../components/FormPageLayout/FormPageLayout.styles';
import LayoutLogo from '../../components/LayoutLogo';

const HorizontalWizardLayoutAside = ({ children }: { children: ReactNode }) => (
	<FormPageLayout.Aside>
		<FormPageLayout.Logo>
			<LayoutLogo />
		</FormPageLayout.Logo>
		{children}
	</FormPageLayout.Aside>
);

export default HorizontalWizardLayoutAside;
