import { PaletteStyleTag } from '@rocket.chat/fuselage';
import { useThemeMode } from '@rocket.chat/ui-client';
import { createPortal } from 'react-dom';

import { codeBlock } from '../lib/codeBlockStyles';

export const MainLayoutStyleTags = () => {
	const theme = useThemeMode();

	return (
		<>
			{/* Keeps mobile browsers' automatic dark mode from recoloring a theme that is already applied. */}
			{createPortal(<meta name='color-scheme' content={theme === 'dark' ? 'dark' : 'only light'} />, document.head)}
			<PaletteStyleTag theme={theme} selector='.rcx-content--main, .rcx-tile' tagId={`main-palette-${theme}`} />
			<PaletteStyleTag theme='dark' selector='.rcx-sidebar--main, .rcx-sidebar-rail, .rcx-sidepanel, .rcx-navbar' tagId='sidebar-palette' />
			{theme === 'dark' && <PaletteStyleTag selector='.rcx-content--main' palette={codeBlock} tagId='codeBlock-palette' />}
		</>
	);
};
