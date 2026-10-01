import type { ReactNode } from 'react';

import * as FormPageLayout from '../../components/FormPageLayout/FormPageLayout.styles';

const HorizontalWizardLayoutContent = ({ children }: { children: ReactNode }) => (
	<FormPageLayout.Content>{children}</FormPageLayout.Content>
);

export default HorizontalWizardLayoutContent;
