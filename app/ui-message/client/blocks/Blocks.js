import { Template } from 'meteor/templating';

import { APIClient } from '../../../utils';
import { modal } from '../../../ui-utils/client/lib/modal';

import './Blocks.html';

Template.Blocks.events({
	async 'click button'() {
		const { actionId, appID, value, mid } = this;
		const { type, ...data } = await APIClient.post('apps/blockit/meu_app/outra_action', { actionId, appID, value, mid });

		if (type === 'modal') {
			modal.push({
				template: 'ModalBlock',
				data,
			});
		}
	},
});

Template.Blocks.helpers({
	template() {
		const { type } = this;

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
