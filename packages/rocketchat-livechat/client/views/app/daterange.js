/* globals popover */

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

		popover.close();
	}
});
