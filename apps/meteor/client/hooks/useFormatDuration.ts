import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

export const useFormatDuration = () => {
	const { t } = useTranslation();

	return useCallback(
		(duration: number) => {
			const days = Math.floor(duration / 86400);
			const hours = Math.floor((duration % 86400) / 3600);
			const minutes = Math.floor(((duration % 86400) % 3600) / 60);
			const seconds = Math.floor(((duration % 86400) % 3600) % 60);
			let out = '';
			if (days > 0) {
				out += `${days} ${t('days')}, `;
			}
			if (hours > 0) {
				out += `${hours} ${t('hours')}, `;
			}
			if (minutes > 0) {
				out += `${minutes} ${t('minutes')}, `;
			}
			if (seconds > 0) {
				out += `${seconds} ${t('seconds')}`;
			}
			return out;
		},
		[t],
	);
};
