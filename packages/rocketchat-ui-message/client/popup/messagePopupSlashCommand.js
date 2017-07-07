Template.messagePopupSlashCommand.helpers({
	printParams() {
		return typeof(this.params) === 'string' ? this.params : this.params[0].description;
	}
});
