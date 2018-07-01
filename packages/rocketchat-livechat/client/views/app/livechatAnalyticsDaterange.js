/* globals popover */

import moment from 'moment';

function setDateRange(value, from, to) {
	Template.currentData().daterange.set({value, from, to});
}

Template.livechatAnalyticsDaterange.helpers({
	bold(prop) {
		return (prop === Template.currentData().daterange.get().value) ? 'rc-popover__item--bold' : '';
	}
});

Template.livechatAnalyticsDaterange.onRendered(function() {});

Template.livechatAnalyticsDaterange.events({
	'change input'({currentTarget}) {
		// const name = currentTarget.getAttribute('name');
		const value = currentTarget.getAttribute('type') === 'checkbox' ? currentTarget.checked : currentTarget.value;

		// console.log(name);
		// console.log(value);
		//
		// document.getElementsByClassName('lc-date-picker-btn')[0].value = value;
		//
		// const today = moment().format('MMM D YYYY');
		//
		// console.log(today);

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
			case 'this-week':
				setDateRange(value, moment().startOf('week').format('MMM D YYYY'), moment().format('MMM D YYYY'));
				break;
			case 'prev-week':
				setDateRange(value, moment().subtract(1, 'weeks').startOf('week').format('MMM D YYYY'), moment().subtract(1, 'weeks').endOf('week').format('MMM D YYYY'));
				break;
			case 'this-month':
				setDateRange(value, moment().startOf('month').format('MMM D YYYY'), moment().format('MMM D YYYY'));
				break;
			case 'prev-month':
				setDateRange(value, moment().subtract(1, 'months').startOf('month').format('MMM D YYYY'), moment().subtract(1, 'months').endOf('month').format('MMM D YYYY'));
				break;
		}
	}
});
