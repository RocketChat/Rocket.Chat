import { Template } from 'meteor/templating';
import { roomTypes } from '../../utils';
import './messageBoxReadOnly.html';

Template.messageBoxReadOnly.helpers({
	customTemplate() {
		return roomTypes.getTemplate(this.rid, 'readOnlyTpl');
	},
});
