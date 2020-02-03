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

	const filterInputFields = ({ type, element }) => type === 'input' && element.initialValue;
	const mapElementToState = ({ element, blockId }) => [element.actionId, { value: element.initialValue, blockId }];
	const groupStateByBlockIdMap = (obj, [key, { blockId, value }]) => {
		obj[blockId] = obj[blockId] || {};
		obj[blockId][key] = value;
		return obj;
	};
	const groupStateByBlockId = (obj) => Object.entries(obj).reduce(groupStateByBlockIdMap, {});

	this.state = new ReactiveDict(Object.fromEntries(this.data.view.blocks.filter(filterInputFields).map(mapElementToState)));

	ReactDOM.render(
		React.createElement(
			modalBlockWithContext({
				onCancel: () => ActionManager.triggerCancel({
					appId,
					view: {
						...this.data.view,
						id: viewId,
						state: groupStateByBlockId(this.state.all()),
					},
				}),
				onClose: () => ActionManager.triggerCancel({
					appId,
					view: {
						...this.data.view,
						id: viewId,
						state: groupStateByBlockId(this.state.all()),
					},
					isCleared: true,
				}),
				onSubmit: () => ActionManager.triggerSubmitView({
					viewId,
					appId,
					payload: {
						view: {
							...this.data.view,
							id: viewId,
							state: groupStateByBlockId(this.state.all()),
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
