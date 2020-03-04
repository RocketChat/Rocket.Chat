import { UIKitIncomingInteractionContainerType } from '@rocket.chat/apps-engine/definition/uikit/UIKitIncomingInteractionContainer';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';

import * as ActionManager from '../ActionManager';
import './Blocks.html';
import { messageBlockWithContext } from './MessageBlock';


Template.Blocks.onRendered(async function() {
	const React = await import('react');
	const ReactDOM = await import('react-dom');
	const state = new ReactiveVar();
	this.autorun(() => {
		state.set(Template.currentData());
	});

	ReactDOM.render(
		React.createElement(messageBlockWithContext({
			action: (options) => {
				const { actionId, value, blockId, mid = this.data.mid } = options;
				ActionManager.triggerBlockAction({
					blockId,
					actionId,
					value,
					mid,
					rid: this.data.rid,
					appId: this.data.blocks[0].appId,
					container: {
						type: UIKitIncomingInteractionContainerType.MESSAGE,
						id: mid,
					},
				});
			},
			// state: alert,
			appId: this.data.appId,
			rid: this.data.rid,
		}), { data: () => state.get() }),
		this.firstNode,
	);
	const event = new Event('rendered');
	this.firstNode.dispatchEvent(event);
});

Template.Blocks.onDestroyed(async function() {
	const ReactDOM = await import('react-dom');
	this.firstNode && ReactDOM.unmountComponentAtNode(this.firstNode);
});
