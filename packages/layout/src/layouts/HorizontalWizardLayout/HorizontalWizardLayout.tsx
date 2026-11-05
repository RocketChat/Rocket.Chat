import type { ReactNode } from 'react';

import DarkModeProvider from '../../DarkModeProvider.js';
import BackgroundLayer from '../../components/BackgroundLayer/index.js';
import * as FormPageLayout from '../../components/FormPageLayout/FormPageLayout.styles.js';
import type { LayoutContextValue } from '../../contexts/LayoutContext.js';
import { LayoutContext } from '../../contexts/LayoutContext.js';

const HorizontalWizardLayout = ({
	children,
	forceDarkMode,
	...rest
}: LayoutContextValue & {
	children: ReactNode;
}) => (
	<DarkModeProvider forcedDarkMode={forceDarkMode}>
		<LayoutContext.Provider value={{ ...rest }}>
			<BackgroundLayer>
				<FormPageLayout.Wrapper>{children}</FormPageLayout.Wrapper>
			</BackgroundLayer>
		</LayoutContext.Provider>
	</DarkModeProvider>
);

export default HorizontalWizardLayout;
