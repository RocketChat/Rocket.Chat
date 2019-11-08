import { Template } from 'meteor/templating';

import './SectionBlock.html';

Template.SectionBlock.helpers({
	template() {
		const { type } = this.accessory;

		switch (type) {
			case 'section':
				return 'SectionBlock';
			case 'divider':
				return 'DividerBlock';
			case 'image':
				return 'ImageBlock';
			case 'actions':
				return 'ActionsBlock';
			case 'context':
				// TODO
				break;
			case 'input':
				// TODO
				break;
		}
	},
	data() {
		const { type, ...data } = this;
		return data;
	},
});
