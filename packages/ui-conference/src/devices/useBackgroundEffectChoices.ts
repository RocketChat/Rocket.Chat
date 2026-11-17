import type { DeviceMenuChoices } from '@rocket.chat/ui-media';
import { useTranslation } from 'react-i18next';

import { useBackgroundEffectSelection } from './BackgroundEffectContext';

/** The camera menu's background section; absent where no effect can run. */
export const useBackgroundEffectChoices = (openSettings: () => void): DeviceMenuChoices | undefined => {
	const { t } = useTranslation();
	const { supported, effect, applying, toggle } = useBackgroundEffectSelection();

	if (!supported) {
		return undefined;
	}

	return {
		title: t('Background'),
		choices: [
			{
				type: 'toggle',
				id: 'effect',
				name: t('Background_effect'),
				note: applying ? t('Starting') : undefined,
				checked: (applying ?? effect).kind !== 'none',
				disabled: !!applying,
				onToggle: toggle,
			},
			{ type: 'action', id: 'settings', name: t('Background_settings'), onAction: openSettings },
		],
	};
};
