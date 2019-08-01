import { Template } from 'meteor/templating';
import moment from 'moment';

import { popover } from '../../../../../ui-utils';
import { setTimeRange } from '../../../lib/timeHandler';
import './livechatRealTimeVisitorsTimeRange.html';

Template.livechatRealTimeVisitorsTimeRange.helpers({
	bold(prop) {
		return prop === Template.currentData().timerange.get().value ? 'rc-popover__item--bold' : '';
	},
});

Template.livechatRealTimeVisitorsTimeRange.events({
	'change input'(e) {
		e.preventDefault();

		const value = e.currentTarget.getAttribute('type') === 'checkbox' ? e.currentTarget.checked : e.currentTarget.value;

		popover.close();

		switch (value) {
			case 'none':
				Template.currentData().timerange.set(setTimeRange(value));
				break;
			case 'last-one-minute':
				Template.currentData().timerange.set(setTimeRange(value, moment(), moment().subtract(1, 'minutes')));
				break;
			case 'last-10-minutes':
				Template.currentData().timerange.set(setTimeRange(value, moment(), moment().subtract(10, 'minutes')));
				break;
			case 'last-thirty-minutes':
				Template.currentData().timerange.set(setTimeRange(value, moment(), moment().subtract(30, 'minutes')));
				break;
			case 'last-hour':
				Template.currentData().timerange.set(setTimeRange(value, moment(), moment().subtract(1, 'hours')));
				break;
			case 'last-six-hour':
				Template.currentData().timerange.set(setTimeRange(value, moment(), moment().subtract(6, 'hours')));
				break;
			case 'last-twelve-hour':
				Template.currentData().timerange.set(setTimeRange(value, moment(), moment().subtract(12, 'hours')));
				break;
		}
	},
});
