/* globals popover */

import moment from 'moment';

Template.livechatAnalyticsDaterange.helpers({
	bold(prop) {
		return (prop === Template.currentData().daterange.get().value) ? 'rc-popover__item--bold' : '';
	}
});

Template.livechatAnalyticsDaterange.events({
	'change input'({currentTarget}) {
		const value = currentTarget.getAttribute('type') === 'checkbox' ? currentTarget.checked : currentTarget.value;

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
						daterange: Template.currentData().daterange
					},
					offsetVertical: target.clientHeight + 10
				};
				popover.open(config);
				break;
			case 'today':
				RocketChat.Livechat.Analytics.setDateRange(Template.currentData().daterange, value, moment().startOf('day'), moment().startOf('day'));
				break;
			case 'yesterday':
				RocketChat.Livechat.Analytics.setDateRange(Template.currentData().daterange, value, moment().subtract(1, 'days').startOf('day'), moment().subtract(1, 'days').startOf('day'));
				break;
			case 'this-week':
				RocketChat.Livechat.Analytics.setDateRange(Template.currentData().daterange, value, moment().startOf('week'), moment().endOf('week'));
				break;
			case 'prev-week':
				RocketChat.Livechat.Analytics.setDateRange(Template.currentData().daterange, value, moment().subtract(1, 'weeks').startOf('week'), moment().subtract(1, 'weeks').endOf('week'));
				break;
			case 'this-month':
				RocketChat.Livechat.Analytics.setDateRange(Template.currentData().daterange, value, moment().startOf('month'), moment().endOf('month'));
				break;
			case 'prev-month':
				RocketChat.Livechat.Analytics.setDateRange(Template.currentData().daterange, value, moment().subtract(1, 'months').startOf('month'), moment().subtract(1, 'months').endOf('month'));
				break;
		}
	}
});
