/* globals popover */

import moment from 'moment';

function setDateRange(value, from, to) {
	Template.currentData().daterange.set({value, from, to});
}

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
			setDateRange('custom', moment(new Date(from)).format('MMM D YYYY'), moment(new Date(to)).format('MMM D YYYY'));
		} else {
			handleError({details: {errorTitle: 'Invalid dates'}, error: 'Didnot select dates'});
		}

		popover.close();
	}
});
