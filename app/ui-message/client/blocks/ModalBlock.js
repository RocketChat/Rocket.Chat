import { UIKitIncomingInteractionContainerType } from '@rocket.chat/apps-engine/definition/uikit/UIKitIncomingInteractionContainer';
import { ReactiveDict } from 'meteor/reactive-dict';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';

import * as ActionManager from '../ActionManager';
import { modalBlockWithContext } from './MessageBlock';
import './ModalBlock.html';


const prevent = (e) => {
	if (e) {
		(e.nativeEvent || e).stopImmediatePropagation();
		e.stopPropagation();
		e.preventDefault();
	}
};

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

	const filterInputFields = ({ element, elements = [] }) => {
		if (element && element.initialValue) {
			return true;
		}
		if (elements.length && elements.map((element) => ({ element })).filter(filterInputFields).length) {
			return true;
		}
	};

	const mapElementToState = ({ element, blockId, elements = [] }) => {
		if (elements.length) {
			return elements.map((element) => ({ element, blockId })).filter(filterInputFields).map(mapElementToState);
		}
		return [element.actionId, { value: element.initialValue, blockId }];
	};

	this.state = new ReactiveDict(this.data.view.blocks.filter(filterInputFields).map(mapElementToState).reduce((obj, el) => {
		if (Array.isArray(el[0])) {
			return { ...obj, ...Object.fromEntries(el) };
		}
		return { ...obj, [el[0]]: el[1] };
	}, {}));

	const groupStateByBlockIdMap = (obj, [key, { blockId, value }]) => {
		obj[blockId] = obj[blockId] || {};
		obj[blockId][key] = value;
		return obj;
	};
	const groupStateByBlockId = (obj) => Object.entries(obj).reduce(groupStateByBlockIdMap, {});
	ReactDOM.render(
		React.createElement(
			modalBlockWithContext({
				onCancel: (e) => {
					prevent(e);
					return ActionManager.triggerCancel({
						appId,
						viewId,
						view: {
							...state.get().view,
							id: viewId,
							state: groupStateByBlockId(this.state.all()),
						},
					});
				},
				onClose: (e) => {
					prevent(e);
					return ActionManager.triggerCancel({
						appId,
						viewId,
						view: {
							...state.get().view,
							id: viewId,
							state: groupStateByBlockId(this.state.all()),
						},
						isCleared: true,
					});
				},
				onSubmit: (e) => {
					prevent(e);
					ActionManager.triggerSubmitView({
						viewId,
						appId,
						payload: {
							view: {
								...state.get().view,
								id: viewId,
								state: groupStateByBlockId(this.state.all()),
							},
						},
					});
				},
				action: ({ actionId, appId, value, blockId, mid = this.data.mid }) => ActionManager.triggerBlockAction({
					container: {
						type: UIKitIncomingInteractionContainerType.VIEW,
						id: viewId,
					},
					actionId,
					appId,
					value,
					blockId,
					mid,
				}),
				state: ({ actionId, value, /* ,appId, */ blockId = 'default' }) => {
					this.state.set(actionId, {
						blockId,
						value,
					});
				},
				...this.data,
			}),
			{ data: () => state.get(), values: () => this.state.all() },
		),
		this.node,
	);
});
Template.ModalBlock.onDestroyed(async function() {
	const ReactDOM = await import('react-dom');
	this.node && ReactDOM.unmountComponentAtNode(this.node);
});
