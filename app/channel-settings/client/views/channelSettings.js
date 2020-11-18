import { HTML } from 'meteor/htmljs';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';

import { ChatRoom } from '../../../models';
import { createTemplateForComponent } from '../../../../client/reactAdapters';

createTemplateForComponent('channelSettingsEditing', () => import('../../../../client/channel/ChannelInfo/EditChannel'), {
	renderContainerView: () => HTML.DIV({ class: 'contextual-bar' }), // eslint-disable-line new-cap
});

createTemplateForComponent('channelSettingsInfo', () => import('../../../../client/channel/ChannelInfo/RoomInfo'), {
	renderContainerView: () => HTML.DIV({ class: 'contextual-bar' }), // eslint-disable-line new-cap
});

Template.channelSettings.helpers({
	channelData() {
		const { editing } = Template.instance();
		return {
			...Template.currentData(),
			openEditing: () => editing.set(true),
			editing() {
				return Template.instance().editing.get();
			},
		};
	},
});

Template.channelSettings.onCreated(function() {
	this.room = ChatRoom.findOne(this.data && this.data.rid);
	this.editing = new ReactiveVar(false);
});
