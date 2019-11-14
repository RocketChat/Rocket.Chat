import { Template } from 'meteor/templating';

import './Blocks.html';
import * as ActionManager from '../ActionManager';

Template.Blocks.events({
	async 'click button'(e) {
		e.preventDefault();
		e.stopPropagation();
		const { actionId, appId, value = e.currentTarget.value, blockId, mid } = this;
		ActionManager.triggerAction({ actionId, appId, value, blockId, mid });
	},
});

Template.Blocks.helpers({
	template() {
		const { type } = this;
		console.log('Blocks', this);
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
				return 'InputElement';
		}
	},
	data(mid) {
		const { type, ...data } = this;
		return { ...data, mid };
	},
});
