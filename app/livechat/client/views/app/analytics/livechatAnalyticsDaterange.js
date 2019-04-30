import { Template } from 'meteor/templating';
import { popover } from '../../../../../ui-utils';
import moment from 'moment';
import { setDateRange } from '../../../lib/dateHandler';
import './livechatAnalyticsDaterange.html';

Template.livechatAnalyticsDaterange.helpers({
	bold(prop) {
		return prop === Template.currentData().daterange.get().value ? 'rc-popover__item--bold' : '';
	},
});

Template.livechatAnalyticsDaterange.events({
	'change input'(e) {
		e.preventDefault();

		const value = e.currentTarget.getAttribute('type') === 'checkbox' ? e.currentTarget.checked : e.currentTarget.value;

		popover.close();

		switch (value) {
			case 'custom':
				const target = document.getElementsByClassName('lc-date-picker-btn')[0];
				const options = [];
				const config = {
					template: 'livechatAnalyticsCustomDaterange',
					currentTarget: target,
					data: {
						options,
						daterange: Template.currentData().daterange,
					},
					offsetVertical: target.clientHeight + 10,
				};
				popover.open(config);
				break;
			case 'today':
				Template.currentData().daterange.set(setDateRange(value, moment().startOf('day'), moment().startOf('day')));
				break;
			case 'yesterday':
				Template.currentData().daterange.set(setDateRange(value, moment().subtract(1, 'days').startOf('day'), moment().subtract(1, 'days').startOf('day')));
				break;
			case 'this-week':
				Template.currentData().daterange.set(setDateRange(value, moment().startOf('week'), moment().endOf('week')));
				break;
			case 'prev-week':
				Template.currentData().daterange.set(setDateRange(value, moment().subtract(1, 'weeks').startOf('week'), moment().subtract(1, 'weeks').endOf('week')));
				break;
			case 'this-month':
				Template.currentData().daterange.set(setDateRange(value, moment().startOf('month'), moment().endOf('month')));
				break;
			case 'prev-month':
				Template.currentData().daterange.set(setDateRange(value, moment().subtract(1, 'months').startOf('month'), moment().subtract(1, 'months').endOf('month')));
				break;
		}
	},
});
