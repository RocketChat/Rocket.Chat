import { Template } from 'meteor/templating';
import { handleError } from '/app/utils';
import { popover } from '/app/ui-utils';
import moment from 'moment';
import { setDateRange } from '../../../lib/dateHandler';


Template.livechatAnalyticsCustomDaterange.helpers({
	from() {
		return moment(Template.currentData().daterange.get().from, 'MMM D YYYY').format('L');
	},
	to() {
		return moment(Template.currentData().daterange.get().to, 'MMM D YYYY').format('L');
	},
});

Template.livechatAnalyticsCustomDaterange.onRendered(function() {
	this.$('.lc-custom-daterange').datepicker({
		autoclose: true,
		todayHighlight: true,
		format: moment.localeData().longDateFormat('L').toLowerCase(),
	});
});


Template.livechatAnalyticsCustomDaterange.events({
	'click .lc-custom-daterange-submit'(e) {
		e.preventDefault();
		const from = document.getElementsByClassName('lc-custom-daterange-from')[0].value;
		const to = document.getElementsByClassName('lc-custom-daterange-to')[0].value;

		if (moment(from).isValid() && moment(to).isValid()) {
			Template.currentData().daterange.set(setDateRange('custom', moment(new Date(from)), moment(new Date(to))));
		} else {
			handleError({ details: { errorTitle: 'Invalid_dates' }, error: 'Error_in_custom_dates' });
		}

		popover.close();
	},
});
