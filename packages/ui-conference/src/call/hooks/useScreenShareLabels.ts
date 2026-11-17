import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import type { ScreenShare } from '../lib/screenShares';

/** What a share is called on the stage, and what its pin control says. */
export const useScreenShareLabels = () => {
	const { t } = useTranslation();

	return useMemo(
		() => ({
			labelOf: ({ name, isLocal }: ScreenShare) => (isLocal || !name ? t('Your_screen') : t('__name__screen', { name })),
			pinLabelOf: ({ name, isLocal }: Pick<ScreenShare, 'name' | 'isLocal'>, pinned: boolean) => {
				if (isLocal || !name) {
					return t(pinned ? 'Unpin_your_screen' : 'Pin_your_screen');
				}
				return t(pinned ? 'Unpin_screen_of' : 'Pin_screen_of', { name });
			},
		}),
		[t],
	);
};
