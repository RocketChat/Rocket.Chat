/* globals popover */

import moment from 'moment';

Template.daterange.onRendered(function() {});

Template.daterange.events({
	'change input'({currentTarget}) {
		const name = currentTarget.getAttribute('name');
		const value = currentTarget.getAttribute('type') === 'checkbox' ? currentTarget.checked : currentTarget.value;
		const user = Meteor.user();

		console.log(name);
		console.log(value);
		console.log(user);

		document.getElementsByClassName('lc-date-picker-btn')[0].value = value;

		const today = moment().format('MMM D YYYY');

		console.log(today);

		if (value === 'custom') {
			popover.close();
			const target = document.getElementsByClassName('lc-date-picker-btn')[0];
			const options = [];
			const config = {
				template: 'customDaterange',
				currentTarget: target,
				data: {
					options
				},
				offsetVertical: target.clientHeight + 10
			};
			popover.open(config);
		} else {
			popover.close();
		}
	}
});
