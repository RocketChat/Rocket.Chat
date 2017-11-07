import _ from 'underscore';

Template.livechatTriggerCondition.helpers({
	hiddenValue(current) {
		if (this.name !== current) {
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
	languages() {
		const languages = TAPi18n.getLanguages();

		let result = Object.keys(languages).map(key => {
			const language = languages[key];
			return _.extend(language, {key});
		});

		result = _.sortBy(result, 'key');
		return result;
	},
	defaultLanguage(key) {
		if (Template.instance().data.name === 'language') {
			return Template.instance().data.value === key;
		} else {
			return 'en' === key;
		}
	}
});

Template.livechatTriggerCondition.events({
	'change .trigger-condition-value input, change .trigger-condition-value select, keyup .trigger-condition-value input'(e/*, instance*/) {
		this.value = e.currentTarget.value;
	},
});
