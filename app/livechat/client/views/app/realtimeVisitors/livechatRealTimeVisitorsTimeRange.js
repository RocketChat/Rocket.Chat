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
			case 'custom':
				const target = document.getElementsByClassName('lc-time-picker-btn')[0];
				const options = [];
				const config = {
					template: 'livechatRealTimeVisitorsCustomDaterange',
					currentTarget: target,
					data: {
						options,
						timerange: Template.currentData().timerange,
					},
					offsetVertical: target.clientHeight + 10,
				};
				popover.open(config);
				break;
			case 'today':
				Template.currentData().timerange.set(setTimeRange(value, moment().startOf('day'), moment().startOf('day')));
				break;
			case 'yesterday':
				Template.currentData().timerange.set(setTimeRange(value, moment().subtract(1, 'days').startOf('day'), moment().subtract(1, 'days').startOf('day')));
				break;
			case 'this-week':
				Template.currentData().timerange.set(setTimeRange(value, moment().startOf('week'), moment().endOf('week')));
				break;
			case 'prev-week':
				Template.currentData().timerange.set(setTimeRange(value, moment().subtract(1, 'weeks').startOf('week'), moment().subtract(1, 'weeks').endOf('week')));
				break;
			case 'this-month':
				Template.currentData().timerange.set(setTimeRange(value, moment().startOf('month'), moment().endOf('month')));
				break;
			case 'prev-month':
				Template.currentData().timerange.set(setTimeRange(value, moment().subtract(1, 'months').startOf('month'), moment().subtract(1, 'months').endOf('month')));
				break;
		}
	},
});
