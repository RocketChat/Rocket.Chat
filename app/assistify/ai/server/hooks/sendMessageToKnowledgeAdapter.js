import { Meteor } from 'meteor/meteor';
import { SystemLogger } from '../../../../logger/server';
import { getKnowledgeAdapter } from '../lib/KnowledgeAdapterProvider';
import { callbacks } from '../../../../callbacks/server';
import { Users } from '../../../../models/server';
import { settings } from '../../../../settings/server';
import { Rooms } from '../../../../models/server';

// unregister callbacks for livechat and the hard-coded api.ai
callbacks.remove('afterSaveMessage', 'externalWebHook');

function isMessageRelevant(message, room) {

	const user = Users.findOneById(message.u._id);
	if (user && user.roles.bot) {
		return; 	// do not trigger a new evaluation if the message was sent from a bot (particularly by assistify itself)
	}

	const knowledgeEnabled = settings.get('Assistify_AI_Enabled');

	if (!knowledgeEnabled) {
		return false;
	}

	if (!room) {
		room = Rooms.findOneById(message.rid);
	}

	return !!getKnowledgeAdapter();
}

callbacks.add('afterSaveMessage', function(message, room) {
	if (isMessageRelevant(message, room)) {
		const knowledgeAdapter = getKnowledgeAdapter();
		SystemLogger.debug(`Send message ${ message._id } to knowledgeAdapter (Meteor.defer()`);
		Meteor.defer(() => {
			const helpRequest = Rooms.findOne(room.helpRequestId);
			const context = {};
			if (helpRequest) { // there might be rooms without help request objects if they have been created inside the chat-application
				context.contextType = 'ApplicationHelp';
				context.environmentType = helpRequest.supportArea;
				context.environment = helpRequest.environment;
			}
			try {
				SystemLogger.debug(`Calling onMessage(${ message._id });`);
				knowledgeAdapter.onMessage(message, context, room.expertise ? [room.expertise] : []);
			} catch (e) {
				SystemLogger.error('Error using knowledge provider ->', e);
			}
		});
		return message;
	}
}, callbacks.priority.LOW, 'Assistify_AI_OnMessage');

callbacks.add('afterDeleteMessage', function(message) {
	if (isMessageRelevant(message)) {
		const knowledgeAdapter = getKnowledgeAdapter();
		SystemLogger.debug(`Propagating delete of message${ message._id } to knowledge-adapter`);
		Meteor.defer(() => {
			try {
				SystemLogger.debug(`Calling afterDeleteMessage(${ message._id });`);
				knowledgeAdapter.afterMessageDeleted(message);
			} catch (e) {
				SystemLogger.error('Error using knowledge provider ->', e);
			}
		});
	}

}, callbacks.priority.LOW, 'Assistify_AI_afterDeleteMessage');

callbacks.add('afterRoomErased', function(room) {
	const knowledgeAdapter = getKnowledgeAdapter();
	SystemLogger.debug(`Propagating delete of room ${ room._id } to knowledge-adapter`);
	Meteor.defer(() => {
		try {
			SystemLogger.debug(`Calling afterRoomErased(${ room._id });`);
			knowledgeAdapter.afterRoomErased(room);
		} catch (e) {
			SystemLogger.error('Error using knowledge provider ->', e);
		}
	});
}, callbacks.priority.LOW, 'Assistify_AI_afterRoomErased');
