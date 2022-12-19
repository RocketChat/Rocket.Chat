import mem from 'mem';
import { Tracker } from 'meteor/tracker';
import type { MomentInput } from 'moment';
import moment from 'moment';

import { settings } from '../../../app/settings/client';

export const formatDate = mem(
	(time: MomentInput) => {
		const messageDateFormat = Tracker.nonreactive(() => settings.get('Message_DateFormat'));
		return moment(time).format(messageDateFormat);
	},
	{ maxAge: 5000 },
);
