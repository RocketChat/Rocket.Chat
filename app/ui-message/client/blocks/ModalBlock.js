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

	const { viewId, appId } = this.data;

	this.autorun(() => {
		state.set(Template.currentData());
	});

	const handleUpdate = ({ type, ...data }) => {
		if (type === 'errors') {
			return state.set({ ...state.get(), errors: data.errors });
		}
		return state.set(data);
	};

	this.cancel = () => {
		ActionManager.off(viewId, handleUpdate);
	};

	this.node = this.find('.js-modal-block').parentElement;
	ActionManager.on(viewId, handleUpdate);

	this.state = new ReactiveDict({});
	ReactDOM.render(
		React.createElement(
			modalBlockWithContext({
				onClose: () => ActionManager.triggerCancel({ appId, viewId }),
				onSubmit: () => ActionManager.triggerSubmitView({
					viewId,
					appId,
					payload: {
						view: {
							id: viewId,
							state: Object.entries(this.state.all()).reduce(
								(obj, [key, { blockId, value }]) => {
									obj[blockId] = obj[blockId] || {};
									obj[blockId][key] = value;
									return obj;
								},
								{},
							),
						},
					},
				}),
				action: ({ actionId, appId, value, blockId, mid = this.data.mid }) => {
					ActionManager.triggerBlockAction({
						actionId,
						appId,
						value,
						blockId,
						mid,
					});
				},
				state: ({ actionId, value, /* ,appId, */ blockId = 'default' }) => {
					this.state.set(actionId, {
						blockId,
						value,
					});
				},
				...this.data,
			}),
			{ data: () => state.get() },
		),
		this.node,
	);
});
Template.ModalBlock.onDestroyed(async function() {
	const ReactDOM = await import('react-dom');
	this.node && ReactDOM.unmountComponentAtNode(this.node);
});
