import { useEffect } from 'react';

import { tooltip } from '../../../../app/ui/client/components/tooltip';
import { useUserPreference } from '../../../contexts/UserContext';

export const useTooltipHandling = (): void => {
	useEffect(() => {
		tooltip.init();
	}, []);

	const hideUsernames = useUserPreference('hideUsernames', false);

	useEffect(() => {
		if (!hideUsernames) {
			return;
		}

		const handleMouseEnter = (e: JQuery.MouseEnterEvent): void => {
			const avatarElem = $(e.currentTarget);
			const username = avatarElem.attr('data-username');
			if (!username) {
				return;
			}

			e.stopPropagation();
			tooltip.showElement($('<span>').text(username), avatarElem);
		};

		const handleMouseLeave = (): void => {
			tooltip.hide();
		};

		$(document.body).on('mouseenter', 'button.thumb', handleMouseEnter);
		$(document.body).on('mouseleave', 'button.thumb', handleMouseLeave);

		return (): void => {
			$(document.body).off('mouseenter', 'button.thumb', handleMouseEnter);
			$(document.body).off('mouseleave', 'button.thumb', handleMouseLeave);
		};
	}, [hideUsernames]);
};
