import { useSetting } from '@rocket.chat/ui-contexts';

export const useLayoutPalette = () => {
	const setting = String(useSetting('Layout_Fuselage_Palette') || '{}');

	return JSON.parse(setting);
};
