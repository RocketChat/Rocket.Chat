import { Template } from 'meteor/templating';
import './omnichannelLivechatTriggerCondition.html';

Template.omnichannelLivechatTriggerCondition.helpers({
	hiddenValue(current) {
		if (this.name === undefined && Template.instance().firstCondition) {
			Template.instance().firstCondition = false;
			return '';
		} if (this.name !== current) {
			return 'hidden';
		}
	},
	conditionSelected(current) {
		if (this.name === current) {
			return 'selected';
		}
	},
	valueFor(condition) {
		if (this.name === condition) {
			return this.value;
		}
	},
});

Template.omnichannelLivechatTriggerCondition.events({
	'change .trigger-condition'(e, instance) {
		instance.$('.trigger-condition-value ').addClass('hidden');
		instance.$(`.${ e.currentTarget.value }`).removeClass('hidden');
	},
});

Template.omnichannelLivechatTriggerCondition.onCreated(function() {
	this.firstCondition = true;
});
