import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import { messageBlockWithContext } from './MessageBlock';
import './Blocks.html';
import * as ActionManager from '../ActionManager';


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
				ActionManager.triggerBlockAction({ actionId, appId: this.data.blocks[1].appId, value, blockId, mid });
			},
			// state: alert,
			appId: this.data.appId,

		}), { data: () => state.get() }),
		this.firstNode
	);
});

Template.Blocks.onDestroyed(async function() {
	const ReactDOM = await import('react-dom');
	ReactDOM.unmountComponentAtNode(this.firstNode);
});
