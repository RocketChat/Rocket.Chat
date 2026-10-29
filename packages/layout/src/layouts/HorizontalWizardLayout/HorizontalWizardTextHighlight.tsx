import type { ReactNode } from 'react';

import { useDarkMode } from '../../DarkModeProvider';
import * as FormPageLayout from '../../components/FormPageLayout/FormPageLayout.styles';

export const HorizontalWizardTextHighlight = (props: { children: ReactNode }) => {
	const isDark = useDarkMode();
	return <FormPageLayout.TitleHighlight {...props} isDark={isDark} />;
};

export default HorizontalWizardTextHighlight;
