import { PaletteStyleTag } from '@rocket.chat/fuselage';
import { useDarkMode } from '@rocket.chat/fuselage-hooks';
import type { ReactNode } from 'react';

const AppLayoutThemeWrapper = ({ children }: { children: ReactNode }) => {
	const dark = useDarkMode();
	return (
		<>
			<PaletteStyleTag theme={dark ? 'dark' : 'light'} tagId='app-layout-palette' />
			{children}
		</>
	);
};

export default AppLayoutThemeWrapper;
