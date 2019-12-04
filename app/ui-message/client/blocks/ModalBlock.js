import { Template } from 'meteor/templating';
import { ReactiveDict } from 'meteor/reactive-dict';
import { ReactiveVar } from 'meteor/reactive-var';

import { modalBlockWithContext } from './MessageBlock';
import './ModalBlock.html';
import * as ActionManager from '../ActionManager';

Template.ModalBlock.onRendered(async function() {
	const React = await import('react');
	const ReactDOM = await import('react-dom');
	const state = new ReactiveVar();

	this.autorun(() => {
		state.set(Template.currentData());
	});

	this.state = new ReactiveDict({});

	ReactDOM.render(
		React.createElement(modalBlockWithContext({
			action: ({ actionId, appId, value, blockId, mid = this.data.mid }) => {
				ActionManager.triggerBlockAction({ actionId, appId, value, blockId, mid });
			},
			state: ({ actionId, value, /* ,appId, */blockId }) => {
				this.state.set(actionId, {
					blockId,
					value,
				});
			},
			appId: this.data.appId,

		}), { data: () => state.get() }),
		this.find('.rc-modal__content')
	);
});

Template.ModalBlock.events({
	'click #blockkit-cancel'(e) {
		e.preventDefault();
		const { appId } = this;

		ActionManager.triggerCancel({ appId });
	},
	'submit form'(e, i) {
		e.preventDefault();

		const { appId } = this;
		ActionManager.triggerSubmitView({
			appId,
			payload: {
				state: Object.entries(i.state.all()).reduce((obj, [key, { blockId, value }]) => {
					if (!e.getAttribute || !e.name) {
						return obj;
					}
					obj[blockId] = obj[blockId] || {};
					obj[blockId][key] = value;
					return obj;
				}, {}),
			},
		});
	},
});
