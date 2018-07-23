Template.messageAction.helpers({
	isButton() {
		return this.type === 'button';
	},
	areButtonsHorizontal() {
		if (Template.parentData(1).button_alignment === 'horizontal') {
			return true;
		}
		return false;
	}
});
