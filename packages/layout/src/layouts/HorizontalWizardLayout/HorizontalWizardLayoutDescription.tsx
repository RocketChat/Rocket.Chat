import type { ComponentProps } from 'react';

import * as FormPageLayout from '../../components/FormPageLayout/FormPageLayout.styles';

const HorizontalWizardLayoutDescription = (props: ComponentProps<typeof FormPageLayout.Description>) => (
	<FormPageLayout.Description {...props} />
);

export default HorizontalWizardLayoutDescription;
