import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import { modal } from '../../../../app/ui-utils';
import { t } from '../../../../app/utils/client';

export const handleEnterpriseError = function(error) {
	if (error.error === 'error-max-guests-number-reached') {
		const message = t('You_reached_the_maximum_number_of_guest_users_allowed_by_your_license.');
		const url = 'https://go.rocket.chat/i/guest-limit-exceeded';
		const email = 'sales@rocket.chat';
		const linkText = TAPi18n.__('Click_here_for_more_details_or_contact_sales_for_a_new_license', { url, email });

		modal.open({
			type: 'error',
			title: t('Maximum_number_of_guests_reached'),
			text: `${ message } ${ linkText }`,
			html: true,
		});

		return true;
	}

	return false;
};
