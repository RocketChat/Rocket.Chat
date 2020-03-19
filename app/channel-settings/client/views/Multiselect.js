import './Multiselect.html';
import { Template } from 'meteor/templating';

import { MultiSelectSettingInput } from '../../../../client/components/admin/settings/inputs/MultiSelectSettingInput';


Template.Multiselect.onRendered(async function() {
	const { MeteorProvider } = await import('../../../../client/providers/MeteorProvider');
	const React = await import('react');
	const ReactDOM = await import('react-dom');
	this.container = this.firstNode;
	this.autorun(() => {
		ReactDOM.render(React.createElement(MeteorProvider, {
			children: React.createElement(MultiSelectSettingInput, Template.currentData()),
		}), this.container);
	});
});


Template.Multiselect.onDestroyed(async function() {
	const ReactDOM = await import('react-dom');
	this.container && ReactDOM.unmountComponentAtNode(this.container);
});
