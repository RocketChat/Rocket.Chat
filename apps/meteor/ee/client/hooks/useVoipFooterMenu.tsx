import { ReactNode, useMemo } from 'react';

import { useDevicesMenuOption } from './useDevicesMenuOption';

export type VoipFooterMenuOptions = Record<
	string,
	{
		type?: 'option' | 'heading' | 'divider';
		label?: ReactNode;
		action?: () => void;
	}
> | null;

export const useVoipFooterMenu = (): VoipFooterMenuOptions => {
	const deviceMenuOption = useDevicesMenuOption();

	const options = useMemo(
		() =>
			deviceMenuOption && {
				deviceSettings: deviceMenuOption,
			},
		[deviceMenuOption],
	);

	return options;
};
