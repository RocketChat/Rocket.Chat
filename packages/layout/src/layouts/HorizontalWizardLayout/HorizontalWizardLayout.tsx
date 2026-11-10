import type { ReactNode } from 'react';

import DarkModeProvider from '../../DarkModeProvider';
import BackgroundLayer from '../../components/BackgroundLayer';
import * as FormPageLayout from '../../components/FormPageLayout/FormPageLayout.styles';
import type { LayoutContextValue } from '../../contexts/LayoutContext';
import { LayoutContext } from '../../contexts/LayoutContext';

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
