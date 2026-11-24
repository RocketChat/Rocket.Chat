import { useTranslation } from 'react-i18next';

import type { ScreenShare } from '../lib/screenShares.js';

export const useScreenShareLabel = (share: ScreenShare): string => {
	const { t } = useTranslation();

	return share.isLocal ? t('Your_screen') : t('__name__screen', { name: share.name });
};
