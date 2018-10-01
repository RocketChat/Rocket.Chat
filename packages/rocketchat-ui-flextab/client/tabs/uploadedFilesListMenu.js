/* globals popover */

Template.uploadedFilesListMenu.helpers({
	file() {
		return this.file;
	},
});

Template.uploadedFilesListMenu.onCreated(function() {});

Template.uploadedFilesListMenu.events({
	'click .download-button'() {
		popover.close();
	},
});
