/* globals popover */

import moment from 'moment';

Template.customDaterange.onRendered(function() {
	this.$('.lc-custom-daterange').datepicker({
		autoclose: true,
		todayHighlight: true,
		format: moment.localeData().longDateFormat('L').toLowerCase()
	});
});


Template.customDaterange.events({
	'click .lc-custom-daterange-submit'(e) {
		e.preventDefault();
		let from = document.getElementsByClassName('lc-custom-daterange-from')[0].value;
		let to = document.getElementsByClassName('lc-custom-daterange-to')[0].value;
		from = moment(from).format('MMM D YYYY');
		to = moment(to).format('MMM D YYYY');

		console.log(from);
		console.log(to);

		popover.close();
	}
});
