import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';


import { ILivechatVisitor } from '../../../../definition/ILivechatVisitor';
import { VoipRoom } from '../../../models/server/raw';
import { settings } from '../../../settings/server';
import { Subscriptions, Users } from '../../../models/server';
import { Logger } from '../../../../server/lib/logger/Logger';

const logger = new Logger('VoipHelper');


const emailValidationRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

export function validateEmail(email: string): boolean {
	if (!emailValidationRegex.test(email)) {
		throw new Meteor.Error('error-invalid-email', `Invalid email ${ email }`, { function: 'Voip.validateEmail', email });
	}
	return true;
}

/**
 * How to deal with custom field? Commenting it for timebeibng
 */
/*
export const parseAgentCustomFields = (customFields: any): any => {
	if (!customFields) {
		return;
	}

	const externalCustomFields = (): any [] => {
		const accountCustomFields = settings.get('Accounts_CustomFields');
		if (!accountCustomFields || (accountCustomFields as string).trim() === '') {
			return [];
		}

		try {
			const parseCustomFields = JSON.parse(accountCustomFields as string);
			return Object.keys(parseCustomFields)
				.filter((customFieldKey) => parseCustomFields[customFieldKey].sendToIntegrations === true);
		} catch (error: any) {
			Voip.logger.error(error);
			return [];
		}
	};

	const externalCF = externalCustomFields();
	return Object.keys(customFields).reduce((newObj as Object, key) => (externalCF.includes(key) ? { ...newObj, [key]: customFields[key] } : newObj), null);
};
*/

export const normalizeAgent = (agentId: string): any => {
	if (!agentId) {
		return;
	}

	if (!settings.get('Livechat_show_agent_info')) {
		return { hiddenInfo: true };
	}

	const agent = Users.getAgentInfo(agentId);
	const { customFields: agentCustomFields, ...extraData } = agent;

	return Object.assign(extraData);
};

export const createVoipRoom = async (rid: string, name: string, agent: any, guest: ILivechatVisitor): Promise<any> => {
	check(rid, String);
	check(name, String);
	check(guest, Match.ObjectIncluding({
		_id: String,
		username: String,
		status: Match.Maybe(String),
		department: Match.Maybe(String),
	}));

	const { _id, username, department: departmentId, status = 'online' } = guest;
	const newRoomAt = new Date();

	logger.debug(`Creating livechat room for visitor ${ _id }`);

	logger.error(`Agent is ${ JSON.stringify(agent) }`);

	const room = Object.assign({
		_id: rid,
		msgs: 0,
		usersCount: 1,
		lm: newRoomAt,
		fname: name,
		t: 'v',
		ts: newRoomAt,
		departmentId,
		v: {
			_id,
			username,
			token: guest.token,
			status,
		},
		servedBy: {
			_id: agent.agentId,
			ts: new Date(),
			username: agent.username,
		},
		cl: false,
		open: true,
		waitingResponse: true,
		// this should be overriden by extraRoomInfo when provided
		// in case it's not provided, we'll use this "default" type
		source: {
			type: 'voip',
			alias: 'unknown',
		},
		queuedAt: newRoomAt,
	});

	const roomId = await (await VoipRoom.insertOne(room)).insertedId;
	return roomId;
};

export const createVoipSubscription = (rid: string, name: string, guest: ILivechatVisitor, agent: any): any => {
	check(rid, String);
	check(name, String);
	check(guest, Match.ObjectIncluding({
		_id: String,
		username: String,
		status: Match.Maybe(String),
	}));
	check(agent, Match.ObjectIncluding({
		agentId: String,
		username: String,
	}));

	const existingSubscription = Subscriptions.findOneByRoomIdAndUserId(rid, agent.agentId);
	if (existingSubscription?._id) {
		return existingSubscription;
	}

	const { _id, username, token, status = 'online' } = guest;

	const subscriptionData = {
		rid,
		fname: name,
		alert: true,
		open: true,
		unread: 1,
		userMentions: 1,
		groupMentions: 0,
		u: {
			_id: agent.agentId,
			username: agent.username,
		},
		t: 'v',
		desktopNotifications: 'all',
		mobilePushNotifications: 'all',
		emailNotifications: 'all',
		v: {
			_id,
			username,
			token,
			status,
		},
	};

	return Subscriptions.insert(subscriptionData);
};

// updateSubscriptionDisplayNameByRoomId has been added to helper
// because raw model for Subscriptions does not provide updateDisplayNameByRoomId

export const updateSubscriptionDisplayNameByRoomId = (roomId: string, fname: string): any => Subscriptions.updateDisplayNameByRoomId(roomId, fname);
export const removeSubscriptionByRoomId = (roomId: string): any => Subscriptions.removeByRoomId(roomId);
