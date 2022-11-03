import { useTranslation } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';

export const useFormatDuration = (): ((duration: number) => string) => {
	const t = useTranslation();

	return useCallback(
		(duration) => {
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
