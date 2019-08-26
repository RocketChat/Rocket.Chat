import { Template } from 'meteor/templating';
import moment from 'moment';

import { handleError } from '../../../../../utils';
import { popover } from '../../../../../ui-utils';
import { setDateRange } from '../../../lib/dateHandler';
import './livechatRealTimeVisitorsCustomDaterange.html';


Template.livechatRealTimeVisitorsCustomDaterange.helpers({
	from() {
		return moment(Template.currentData().timerange.get().from, 'MMM D YYYY').format('L');
	},
	to() {
		return moment(Template.currentData().timerange.get().to, 'MMM D YYYY').format('L');
	},
});

Template.livechatRealTimeVisitorsCustomDaterange.onRendered(function() {
	this.$('.lc-custom-timerange').datepicker({
		autoclose: true,
		todayHighlight: true,
		format: moment.localeData().longDateFormat('L').toLowerCase(),
	});
});


Template.livechatRealTimeVisitorsCustomDaterange.events({
	'click .lc-custom-timerange-submit'(e) {
		e.preventDefault();
		const from = document.getElementsByClassName('lc-custom-timerange-from')[0].value;
		const to = document.getElementsByClassName('lc-custom-timerange-to')[0].value;

		if (moment(from).isValid() && moment(to).isValid()) {
			Template.currentData().timerange.set(setDateRange('custom', moment(new Date(from)), moment(new Date(to))));
		} else {
			handleError({ details: { errorTitle: 'Invalid_dates' }, error: 'Error_in_custom_dates' });
		}

		popover.close();
	},
});
