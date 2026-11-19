import { useTranslation } from 'react-i18next';

import type { ScreenShare } from '../lib/screenShares';

export const useScreenShareLabel = ({ name, isLocal }: Pick<ScreenShare, 'name' | 'isLocal'>): string => {
	const { t } = useTranslation();

	return isLocal || !name ? t('Your_screen') : t('__name__screen', { name });
};
