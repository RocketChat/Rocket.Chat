import { useEffect } from 'react';

import { isIOsDevice } from '../../../lib/utils/isIOsDevice';

export const useTouchEventCorrection = (): void => {
	useEffect(() => {
		if (!isIOsDevice || !window.matchMedia('(hover: none)').matches) {
			return;
		}

		const handleTouchEnd = (e: JQuery.TouchEndEvent): void => {
			if (!e.target.matches(':hover')) {
				return;
			}

			e.target.click();
		};

		$(document.body).on('touchend', 'a', handleTouchEnd);

		return (): void => {
			$(document.body).off('touchend', 'a', handleTouchEnd);
		};
	}, []);
};
