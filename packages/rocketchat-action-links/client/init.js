Template.room.events({
	'click .action-link'(event) {
		event.preventDefault();
		event.stopPropagation();
		const data = Blaze.getData(event.currentTarget);
		// console.log("passing fuctindex....", event);

		// TODO, better way to grab stored HTML meta data?
		Meteor.call('actionLinkHandler', event.currentTarget.childNodes[1].name, data._arguments[1], Meteor.userId());
	},
});