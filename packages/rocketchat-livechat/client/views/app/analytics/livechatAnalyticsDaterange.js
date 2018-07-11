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
				RocketChat.Livechat.Analytics.setDateRange(Template.currentData().daterange, value, moment().format('MMM D YYYY'), moment().format('MMM D YYYY'));
				break;
			case 'yesterday':
				RocketChat.Livechat.Analytics.setDateRange(Template.currentData().daterange, value, moment().subtract(1, 'days').format('MMM D YYYY'), moment().subtract(1, 'days').format('MMM D YYYY'));
				break;
			case 'this-week':
				RocketChat.Livechat.Analytics.setDateRange(Template.currentData().daterange, value, moment().startOf('week').format('MMM D YYYY'), moment().endOf('week').format('MMM D YYYY'));
				break;
			case 'prev-week':
				RocketChat.Livechat.Analytics.setDateRange(Template.currentData().daterange, value, moment().subtract(1, 'weeks').startOf('week').format('MMM D YYYY'), moment().subtract(1, 'weeks').endOf('week').format('MMM D YYYY'));
				break;
			case 'this-month':
				RocketChat.Livechat.Analytics.setDateRange(Template.currentData().daterange, value, moment().startOf('month').format('MMM D YYYY'), moment().endOf('month').format('MMM D YYYY'));
				break;
			case 'prev-month':
				RocketChat.Livechat.Analytics.setDateRange(Template.currentData().daterange, value, moment().subtract(1, 'months').startOf('month').format('MMM D YYYY'), moment().subtract(1, 'months').endOf('month').format('MMM D YYYY'));
				break;
		}
	}
});
