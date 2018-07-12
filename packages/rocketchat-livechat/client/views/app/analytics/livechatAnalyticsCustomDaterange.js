/* globals popover */

import moment from 'moment';

Template.livechatAnalyticsCustomDaterange.helpers({
	from() {
		return moment(new Date(Template.currentData().daterange.get().from)).format('L');
	},
	to() {
		return moment(new Date(Template.currentData().daterange.get().to)).format('L');
	}
});

Template.livechatAnalyticsCustomDaterange.onRendered(function() {
	this.$('.lc-custom-daterange').datepicker({
		autoclose: true,
		todayHighlight: true,
		format: moment.localeData().longDateFormat('L').toLowerCase()
	});
});


Template.livechatAnalyticsCustomDaterange.events({
	'click .lc-custom-daterange-submit'(e) {
		e.preventDefault();
		const from = document.getElementsByClassName('lc-custom-daterange-from')[0].value;
		const to = document.getElementsByClassName('lc-custom-daterange-to')[0].value;

		if (moment(from).isValid() && moment(to).isValid()) {
			RocketChat.Livechat.Analytics.setDateRange(Template.currentData().daterange, 'custom', moment(new Date(from)), moment(new Date(to)));
		} else {
			handleError({details: {errorTitle: 'Invalid_dates'}, error: 'Error_in_custom_dates'});
		}

		popover.close();
	}
});
