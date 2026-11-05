import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

import DarkModeProvider from '../../DarkModeProvider.js';
import BackgroundLayer from '../../components/BackgroundLayer/index.js';
import LayoutLogo from '../../components/LayoutLogo/index.js';
import type { LayoutContextValue } from '../../contexts/LayoutContext.js';
import { LayoutContext } from '../../contexts/LayoutContext.js';

const VerticalWizardLayout = ({
	children,
	forceDarkMode,
	...rest
}: LayoutContextValue & {
	children: ReactNode;
}) => (
	<DarkModeProvider forcedDarkMode={forceDarkMode}>
		<LayoutContext.Provider value={{ ...rest }}>
			<BackgroundLayer>
				<Box
					display='flex'
					flexDirection='column'
					alignItems='center'
					textAlign='center'
					width='100%'
					maxWidth={576}
					paddingBlock={32}
					paddingInline={16}
				>
					<Box marginBlock={12}>
						<LayoutLogo />
					</Box>
					{children}
				</Box>
			</BackgroundLayer>
		</LayoutContext.Provider>
	</DarkModeProvider>
);

export default VerticalWizardLayout;
