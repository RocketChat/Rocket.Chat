import { Template } from 'meteor/templating';
import moment from 'moment';

import { handleError } from '../../../../../utils';
import { popover } from '../../../../../ui-utils';
import { setDateRange } from '../../../lib/dateHandler';
import './livechatAnalyticsCustomDaterange.html';


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
		const from = moment(document.getElementsByClassName('lc-custom-daterange-from')[0].value, ['DD-MM-YYYY', 'MM-DD-YYYY']);
		const to = moment(document.getElementsByClassName('lc-custom-daterange-to')[0].value, ['DD-MM-YYYY', 'MM-DD-YYYY']);

		if (from.isValid() && to.isValid()) {
			Template.currentData().daterange.set(setDateRange('custom', from.toDate(), to.toDate()));
		} else {
			handleError({ details: { errorTitle: 'Invalid_dates' }, error: 'Error_in_custom_dates' });
		}

		popover.close();
	},
});
