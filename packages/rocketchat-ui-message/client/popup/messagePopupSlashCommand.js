Template.messagePopupSlashCommand.helpers({
  printParams: function () {

    if(typeof(this.params) === 'string') {
      return this.params;
    } else if (this.params[0] && description in this.params[0]) {
      return this.params.description;
    }
  }
});
