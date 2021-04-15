import { Meteor } from 'meteor/meteor';
import toastr from 'toastr';

import { t } from '../../../utils';

export const offlineAction = (action) => {
	if (Meteor.status().status === 'connected') {
		return false;
	}
	return toastr.info(t('Check_your_internet_connection', { action }));
};
