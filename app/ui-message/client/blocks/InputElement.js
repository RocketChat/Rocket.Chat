import { Template } from 'meteor/templating';

import './InputElement.html';

Template.InputElement.helpers({
	data() {
		const { blockId, element } = this;
		return { blockId, ...element };
	},
	template() {
		switch (this.element.type) {
			case 'plain_text_input':
				return 'InputElement__PlainTextInput';
			case 'static_select':
				return 'InputElement__StaticSelect';
			case 'multi_static_select':
				return 'InputElement__StaticMultiSelect';
		}
	},
});
