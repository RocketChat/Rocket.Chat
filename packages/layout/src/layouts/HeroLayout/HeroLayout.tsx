import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

import DarkModeProvider from '../../DarkModeProvider';
import BackgroundLayer from '../../components/BackgroundLayer';
import LayoutLogo from '../../components/LayoutLogo';
import type { LayoutContextValue } from '../../contexts/LayoutContext';
import { LayoutContext } from '../../contexts/LayoutContext';

const HeroLayout = ({
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
					gap='x32'
					paddingBlockStart='x32'
					paddingBlockEnd={64}
					paddingInline='x16'
				>
					<LayoutLogo />
					{children}
				</Box>
			</BackgroundLayer>
		</LayoutContext.Provider>
	</DarkModeProvider>
);

export default HeroLayout;
