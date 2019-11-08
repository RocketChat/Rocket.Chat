import { Template } from 'meteor/templating';

import './SectionBlock.html';

Template.SectionBlock.helpers({
	template() {
		const { type } = this.accessory;
		console.log(this);
		switch (type) {
			case 'button':
				return 'ButtonElement';
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
		const { accessory: { type, ...data }, appId, blockId } = this;
		return { ...data, appId, blockId };
	},
});
