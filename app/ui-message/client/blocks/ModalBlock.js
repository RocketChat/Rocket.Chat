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

	const { viewId } = this.data;

	this.autorun(() => {
		state.set(Template.currentData());
	});

	const handleUpdate = (data) => {
		state.set(data);
	};

	this.cancel = () => {
		ActionManager.off(viewId, handleUpdate);
	};

	ActionManager.on(viewId, handleUpdate);

	this.state = new ReactiveDict({});

	ReactDOM.render(
		React.createElement(modalBlockWithContext({
			action: ({ actionId, appId, value, blockId, mid = this.data.mid }) => {
				ActionManager.triggerBlockAction({ actionId, appId, value, blockId, mid });
			},
			state: ({ actionId, value, /* ,appId, */blockId = 'default' }) => {
				this.state.set(actionId, {
					blockId,
					value,
				});
			},
			appId: this.data.appId,

		}), { data: () => state.get() }),
		this.find('.js-modal-block')
	);
});
Template.ModalBlock.onDestroyed(async function() {
	const ReactDOM = await import('react-dom');
	const node = this.find('.js-modal-block');
	node && ReactDOM.unmountComponentAtNode(node);
});

Template.ModalBlock.events({
	'click #blockkit-cancel'(e, i) {
		e.preventDefault();
		const { appId, viewId } = i.data;

		ActionManager.triggerCancel({ appId, viewId });
	},
	'submit form'(e, i) {
		e.preventDefault();

		const { appId, viewId } = i.data;
		ActionManager.triggerSubmitView({
			appId,
			viewId,
			payload: {
				state: Object.entries(i.state.all()).reduce((obj, [key, { blockId, value }]) => {
					obj[blockId] = obj[blockId] || {};
					obj[blockId][key] = value;
					return obj;
				}, {}),
			},
		});
	},
});
