import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

import DarkModeProvider from '../../DarkModeProvider';
import BackgroundLayer from '../../components/BackgroundLayer';
import LayoutLogo from '../../components/LayoutLogo';
import type { LayoutContextValue } from '../../contexts/LayoutContext';
import { LayoutContext } from '../../contexts/LayoutContext';

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
