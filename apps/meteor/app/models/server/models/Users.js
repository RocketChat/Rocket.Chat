import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import _ from 'underscore';
import s from 'underscore.string';
import { escapeRegExp } from '@rocket.chat/string-helpers';

import { Base } from './_Base';
import Subscriptions from './Subscriptions';
import { settings } from '../../../settings/server';

const queryStatusAgentOnline = (extraFilters = {}) => ({
	statusLivechat: 'available',
	roles: 'livechat-agent',
	$or: [
		{
			status: {
				$exists: true,
				$ne: 'offline',
			},
			roles: {
				$ne: 'bot',
			},
		},
		{
			roles: 'bot',
		},
	],
	...extraFilters,
	...(settings.get('Livechat_enabled_when_agent_idle') === false && {
		statusConnection: { $ne: 'away' },
	}),
});
export class Users extends Base {
	constructor(...args) {
		super(...args);

		this.defaultFields = {
			__rooms: 0,
		};

		this.tryEnsureIndex({ __rooms: 1 }, { sparse: 1 });

		this.tryEnsureIndex({ roles: 1 }, { sparse: 1 });
		this.tryEnsureIndex({ name: 1 });
		this.tryEnsureIndex({ bio: 1 }, { sparse: 1 });
		this.tryEnsureIndex({ nickname: 1 }, { sparse: 1 });
		this.tryEnsureIndex({ createdAt: 1 });
		this.tryEnsureIndex({ lastLogin: 1 });
		this.tryEnsureIndex({ status: 1 });
		this.tryEnsureIndex({ statusText: 1 });
		this.tryEnsureIndex({ active: 1 }, { sparse: 1 });
		this.tryEnsureIndex({ statusConnection: 1 }, { sparse: 1 });
		this.tryEnsureIndex({ appId: 1 }, { sparse: 1 });
		this.tryEnsureIndex({ type: 1 });
		this.tryEnsureIndex({ federation: 1 }, { sparse: true });
		this.tryEnsureIndex({ isRemote: 1 }, { sparse: true });
		this.tryEnsureIndex({ 'services.saml.inResponseTo': 1 });
		this.tryEnsureIndex({ openBusinessHours: 1 }, { sparse: true });
		this.tryEnsureIndex({ statusLivechat: 1 }, { sparse: true });
		this.tryEnsureIndex({ extension: 1 }, { sparse: true, unique: true });
		this.tryEnsureIndex({ language: 1 }, { sparse: true });
		this.tryEnsureIndex({ 'active': 1, 'services.email2fa.enabled': 1 }, { sparse: true }); // used by statistics
		this.tryEnsureIndex({ 'active': 1, 'services.totp.enabled': 1 }, { sparse: true }); // used by statistics
	}

	getLoginTokensByUserId(userId) {
		const query = {
			'services.resume.loginTokens.type': {
				$exists: true,
				$eq: 'personalAccessToken',
			},
			'_id': userId,
		};

		return this.find(query, { fields: { 'services.resume.loginTokens': 1 } });
	}

	addPersonalAccessTokenToUser({ userId, loginTokenObject }) {
		return this.update(userId, {
			$push: {
				'services.resume.loginTokens': loginTokenObject,
			},
		});
	}

	removePersonalAccessTokenOfUser({ userId, loginTokenObject }) {
		return this.update(userId, {
			$pull: {
				'services.resume.loginTokens': loginTokenObject,
			},
		});
	}

	findPersonalAccessTokenByTokenNameAndUserId({ userId, tokenName }) {
		const query = {
			'services.resume.loginTokens': {
				$elemMatch: { name: tokenName, type: 'personalAccessToken' },
			},
			'_id': userId,
		};

		return this.findOne(query);
	}

	setOperator(_id, operator) {
		// TODO:: Create class Agent
		const update = {
			$set: {
				operator,
			},
		};

		return this.update(_id, update);
	}

	checkOnlineAgents(agentId) {
		// TODO:: Create class Agent
		const query = queryStatusAgentOnline(agentId && { _id: agentId });

		return Boolean(this.findOne(query));
	}

	findOnlineAgents(agentId) {
		// TODO:: Create class Agent
		const query = queryStatusAgentOnline(agentId && { _id: agentId });

		return this.find(query);
	}

	findBotAgents(usernameList) {
		// TODO:: Create class Agent
		const query = {
			roles: {
				$all: ['bot', 'livechat-agent'],
			},
			...(usernameList && {
				username: {
					$in: [].concat(usernameList),
				},
			}),
		};

		return this.find(query);
	}

	findOneBotAgent() {
		// TODO:: Create class Agent
		const query = {
			roles: {
				$all: ['bot', 'livechat-agent'],
			},
		};

		return this.findOne(query);
	}

	findOneOnlineAgentByUserList(userList, options) {
		// TODO:: Create class Agent
		const username = {
			$in: [].concat(userList),
		};

		const query = queryStatusAgentOnline({ username });

		return this.findOne(query, options);
	}

	findOneOnlineAgentById(_id) {
		// TODO: Create class Agent
		const query = queryStatusAgentOnline({ _id });

		return this.findOne(query);
	}

	findOneAgentById(_id, options) {
		// TODO: Create class Agent
		const query = {
			_id,
			roles: 'livechat-agent',
		};

		return this.findOne(query, options);
	}

	findAgents() {
		// TODO: Create class Agent
		const query = {
			roles: 'livechat-agent',
		};

		return this.find(query);
	}

	findOnlineUserFromList(userList) {
		// TODO: Create class Agent
		const username = {
			$in: [].concat(userList),
		};

		const query = queryStatusAgentOnline({ username });

		return this.find(query);
	}

	async getNextAgent(ignoreAgentId, extraQuery) {
		// TODO: Create class Agent
		// fetch all unavailable agents, and exclude them from the selection
		const unavailableAgents = (await this.getUnavailableAgents(null, extraQuery)).map((u) => u.username);
		const extraFilters = {
			...(ignoreAgentId && { _id: { $ne: ignoreAgentId } }),
			// limit query to remove booked agents
			username: { $nin: unavailableAgents },
		};

		const query = queryStatusAgentOnline(extraFilters);

		const sort = {
			livechatCount: 1,
			username: 1,
		};

		const update = {
			$inc: {
				livechatCount: 1,
			},
		};

		const user = await this.model.rawCollection().findOneAndUpdate(query, update, { sort, returnDocument: 'after' });
		if (user && user.value) {
			return {
				agentId: user.value._id,
				username: user.value.username,
			};
		}
		return null;
	}

	getUnavailableAgents() {
		return [];
	}

	async getNextBotAgent(ignoreAgentId) {
		// TODO: Create class Agent
		const query = {
			roles: {
				$all: ['bot', 'livechat-agent'],
			},
			...(ignoreAgentId && { _id: { $ne: ignoreAgentId } }),
		};

		const sort = {
			livechatCount: 1,
			username: 1,
		};

		const update = {
			$inc: {
				livechatCount: 1,
			},
		};

		const user = await this.model.rawCollection().findOneAndUpdate(query, update, { sort, returnDocument: 'after' });
		if (user && user.value) {
			return {
				agentId: user.value._id,
				username: user.value.username,
			};
		}
		return null;
	}

	setLivechatStatus(userId, status) {
		// TODO: Create class Agent
		const query = {
			_id: userId,
		};

		const update = {
			$set: {
				statusLivechat: status,
				livechatStatusSystemModified: false,
			},
		};

		return this.update(query, update);
	}

	setLivechatData(userId, data = {}) {
		// TODO: Create class Agent
		const query = {
			_id: userId,
		};

		const update = {
			$set: {
				livechat: data,
			},
		};

		return this.update(query, update);
	}

	closeOffice() {
		// TODO: Create class Agent
		this.findAgents().forEach((agent) => this.setLivechatStatus(agent._id, 'not-available'));
	}

	openOffice() {
		// TODO: Create class Agent
		this.findAgents().forEach((agent) => this.setLivechatStatus(agent._id, 'available'));
	}

	getAgentInfo(agentId) {
		// TODO: Create class Agent
		const query = {
			_id: agentId,
		};

		const options = {
			fields: {
				name: 1,
				username: 1,
				phone: 1,
				customFields: 1,
				status: 1,
				livechat: 1,
			},
		};

		if (settings.get('Livechat_show_agent_email')) {
			options.fields.emails = 1;
		}

		return this.findOne(query, options);
	}

	roleBaseQuery(userId) {
		return { _id: userId };
	}

	setE2EPublicAndPrivateKeysByUserId(userId, { public_key, private_key }) {
		this.update(
			{ _id: userId },
			{
				$set: {
					'e2e.public_key': public_key,
					'e2e.private_key': private_key,
				},
			},
		);
	}

	rocketMailUnsubscribe(_id, createdAt) {
		const query = {
			_id,
			createdAt: new Date(parseInt(createdAt)),
		};
		const update = {
			$set: {
				'mailer.unsubscribed': true,
			},
		};
		const affectedRows = this.update(query, update);
		return affectedRows;
	}

	fetchKeysByUserId(userId) {
		const user = this.findOne({ _id: userId }, { fields: { e2e: 1 } });

		if (!user || !user.e2e || !user.e2e.public_key) {
			return {};
		}

		return {
			public_key: user.e2e.public_key,
			private_key: user.e2e.private_key,
		};
	}

	disable2FAAndSetTempSecretByUserId(userId, tempToken) {
		return this.update(
			{
				_id: userId,
			},
			{
				$set: {
					'services.totp': {
						enabled: false,
						tempSecret: tempToken,
					},
				},
			},
		);
	}

	enable2FAAndSetSecretAndCodesByUserId(userId, secret, backupCodes) {
		return this.update(
			{
				_id: userId,
			},
			{
				$set: {
					'services.totp.enabled': true,
					'services.totp.secret': secret,
					'services.totp.hashedBackup': backupCodes,
				},
				$unset: {
					'services.totp.tempSecret': 1,
				},
			},
		);
	}

	disable2FAByUserId(userId) {
		return this.update(
			{
				_id: userId,
			},
			{
				$set: {
					'services.totp': {
						enabled: false,
					},
				},
			},
		);
	}

	addRoomByUserId(_id, rid) {
		return this.update(
			{
				_id,
				__rooms: { $ne: rid },
			},
			{
				$addToSet: { __rooms: rid },
			},
		);
	}

	removeRoomByUserId(_id, rid) {
		return this.update(
			{
				_id,
				__rooms: rid,
			},
			{
				$pull: { __rooms: rid },
			},
		);
	}

	removeAllRoomsByUserId(_id) {
		return this.update(
			{
				_id,
			},
			{
				$set: { __rooms: [] },
			},
		);
	}

	removeRoomByRoomId(rid) {
		return this.update(
			{
				__rooms: rid,
			},
			{
				$pull: { __rooms: rid },
			},
			{ multi: true },
		);
	}

	removeRoomByRoomIds(rids) {
		return this.update(
			{
				__rooms: { $in: rids },
			},
			{
				$pullAll: { __rooms: rids },
			},
			{ multi: true },
		);
	}

	removeRoomsByRoomIdsAndUserId(rids, userId) {
		return this.update(
			{
				_id: userId,
				__rooms: { $in: rids },
			},
			{
				$pullAll: { __rooms: rids },
			},
			{ multi: true },
		);
	}

	update2FABackupCodesByUserId(userId, backupCodes) {
		return this.update(
			{
				_id: userId,
			},
			{
				$set: {
					'services.totp.hashedBackup': backupCodes,
				},
			},
		);
	}

	enableEmail2FAByUserId(userId) {
		return this.update(
			{
				_id: userId,
			},
			{
				$set: {
					'services.email2fa': {
						enabled: true,
						changedAt: new Date(),
					},
				},
			},
		);
	}

	disableEmail2FAByUserId(userId) {
		return this.update(
			{
				_id: userId,
			},
			{
				$set: {
					'services.email2fa': {
						enabled: false,
						changedAt: new Date(),
					},
				},
			},
		);
	}

	findByIdsWithPublicE2EKey(ids, options) {
		const query = {
			'_id': {
				$in: ids,
			},
			'e2e.public_key': {
				$exists: 1,
			},
		};

		return this.find(query, options);
	}

	resetE2EKey(userId) {
		this.update(
			{ _id: userId },
			{
				$unset: {
					e2e: '',
				},
			},
		);
	}

	removeExpiredEmailCodesOfUserId(userId) {
		this.update(
			{ _id: userId },
			{
				$pull: {
					'services.emailCode': {
						expire: { $lt: new Date() },
					},
				},
			},
		);
	}

	removeEmailCodeByUserIdAndCode(userId, code) {
		this.update(
			{ _id: userId },
			{
				$pull: {
					'services.emailCode': {
						code,
					},
				},
			},
		);
	}

	addEmailCodeByUserId(userId, code, expire) {
		this.update(
			{ _id: userId },
			{
				$push: {
					'services.emailCode': {
						$each: [
							{
								code,
								expire,
							},
						],
						$slice: -5,
					},
				},
			},
		);
	}

	/**
	 * @param {IRole['_id'][]} roles the list of role ids
	 * @param {null} scope the value for the role scope (room id) - not used in the users collection
	 * @param {any} options
	 */
	findUsersInRoles(roles, scope, options) {
		roles = [].concat(roles);

		const query = {
			roles: { $in: roles },
		};

		return this.find(query, options);
	}

	/**
	 * @param {IRole['_id'][]} roles the list of role ids
	 * @param {any} options
	 */
	findActiveUsersInRoles(roles, options = undefined) {
		roles = [].concat(roles);

		const query = {
			roles: { $in: roles },
			active: true,
		};

		return this.find(query, options);
	}

	findOneByAppId(appId, options = {}) {
		const query = { appId };

		return this.findOne(query, options);
	}

	findOneByImportId(_id, options) {
		return this.findOne({ importIds: _id }, options);
	}

	findOneByUsernameIgnoringCase(username, options) {
		if (typeof username === 'string') {
			username = new RegExp(`^${escapeRegExp(username)}$`, 'i');
		}

		const query = { username };

		return this.findOne(query, options);
	}

	findOneByUsernameAndRoomIgnoringCase(username, rid, options) {
		if (typeof username === 'string') {
			username = new RegExp(`^${escapeRegExp(username)}$`, 'i');
		}

		const query = {
			__rooms: rid,
			username,
		};

		return this.findOne(query, options);
	}

	findOneByUsernameAndServiceNameIgnoringCase(username, userId, serviceName, options) {
		if (typeof username === 'string') {
			username = new RegExp(`^${escapeRegExp(username)}$`, 'i');
		}

		const query = { username, [`services.${serviceName}.id`]: userId };

		return this.findOne(query, options);
	}

	findOneByEmailAddressAndServiceNameIgnoringCase(emailAddress, userId, serviceName, options) {
		const query = {
			'emails.address': String(emailAddress).trim().toLowerCase(),
			[`services.${serviceName}.id`]: userId,
		};

		return this.findOne(query, options);
	}

	findOneByUsername(username, options) {
		const query = { username };

		return this.findOne(query, options);
	}

	findOneByEmailAddress(emailAddress, options) {
		const query = { 'emails.address': String(emailAddress).trim().toLowerCase() };

		return this.findOne(query, options);
	}

	findOneAdmin(admin, options) {
		const query = { admin };

		return this.findOne(query, options);
	}

	findOneByIdAndLoginToken(_id, token, options) {
		const query = {
			_id,
			'services.resume.loginTokens.hashedToken': Accounts._hashLoginToken(token),
		};

		return this.findOne(query, options);
	}

	findOneById(userId, options = {}) {
		const query = { _id: userId };

		return this.findOne(query, options);
	}

	findOneActiveById(userId, options) {
		const query = {
			_id: userId,
			active: true,
		};

		return this.findOne(query, options);
	}

	findOneByIdOrUsername(idOrUsername, options) {
		const query = {
			$or: [
				{
					_id: idOrUsername,
				},
				{
					username: idOrUsername,
				},
			],
		};

		return this.findOne(query, options);
	}

	findOneByRolesAndType(roles, type, options) {
		const query = { roles, type };

		return this.findOne(query, options);
	}

	// FIND
	findByIds(users, options) {
		const query = { _id: { $in: users } };
		return this.find(query, options);
	}

	findNotOfflineByIds(users, options) {
		const query = {
			_id: { $in: users },
			status: {
				$in: ['online', 'away', 'busy'],
			},
		};
		return this.find(query, options);
	}

	findUsersNotOffline(options) {
		const query = {
			username: {
				$exists: 1,
			},
			status: {
				$in: ['online', 'away', 'busy'],
			},
		};

		return this.find(query, options);
	}

	findNotIdUpdatedFrom(uid, from, options) {
		const query = {
			_id: { $ne: uid },
			username: {
				$exists: 1,
			},
			_updatedAt: { $gte: from },
		};

		return this.find(query, options);
	}

	findByRoomId(rid, options) {
		const data = Subscriptions.findByRoomId(rid)
			.fetch()
			.map((item) => item.u._id);
		const query = {
			_id: {
				$in: data,
			},
		};

		return this.find(query, options);
	}

	findByUsername(username, options) {
		const query = { username };

		return this.find(query, options);
	}

	findByUsernamesIgnoringCase(usernames, options) {
		const query = {
			username: {
				$in: usernames.filter(Boolean).map((u) => new RegExp(`^${escapeRegExp(u)}$`, 'i')),
			},
		};

		return this.find(query, options);
	}

	findActive(options = {}) {
		return this.find(
			{
				active: true,
				type: { $nin: ['app'] },
				roles: { $ne: ['guest'] },
			},
			options,
		);
	}

	findActiveByUserIds(ids, options = {}) {
		return this.find(
			{
				active: true,
				type: { $nin: ['app'] },
				roles: { $ne: ['guest'] },
				_id: { $in: ids },
			},
			options,
		);
	}

	findActiveLocalGuests(idExceptions = [], options = {}) {
		const query = {
			active: true,
			type: { $nin: ['app'] },
			roles: {
				$eq: 'guest',
				$size: 1,
			},
			isRemote: { $ne: true },
		};

		if (idExceptions) {
			if (!_.isArray(idExceptions)) {
				idExceptions = [idExceptions];
			}

			query._id = { $nin: idExceptions };
		}

		return this.find(query, options);
	}

	findUsersByNameOrUsername(nameOrUsername, options) {
		const query = {
			username: {
				$exists: 1,
			},

			$or: [{ name: nameOrUsername }, { username: nameOrUsername }],

			type: {
				$in: ['user'],
			},
		};

		return this.find(query, options);
	}

	findByUsernameNameOrEmailAddress(usernameNameOrEmailAddress, options) {
		const query = {
			$or: [
				{ name: usernameNameOrEmailAddress },
				{ username: usernameNameOrEmailAddress },
				{ 'emails.address': usernameNameOrEmailAddress },
			],
			type: {
				$in: ['user', 'bot'],
			},
		};

		return this.find(query, options);
	}

	findCrowdUsers(options) {
		const query = { crowd: true };

		return this.find(query, options);
	}

	getLastLogin(options = { fields: { _id: 0, lastLogin: 1 } }) {
		options.sort = { lastLogin: -1 };
		options.limit = 1;
		const [user] = this.find({}, options).fetch();
		return user?.lastLogin;
	}

	findUsersByUsernames(usernames, options) {
		const query = {
			username: {
				$in: usernames,
			},
		};

		return this.find(query, options);
	}

	findUsersByIds(ids, options) {
		const query = {
			_id: {
				$in: ids,
			},
		};
		return this.find(query, options);
	}

	findUsersWithUsernameByIds(ids, options) {
		const query = {
			_id: {
				$in: ids,
			},
			username: {
				$exists: 1,
			},
		};

		return this.find(query, options);
	}

	findUsersWithUsernameByIdsNotOffline(ids, options) {
		const query = {
			_id: {
				$in: ids,
			},
			username: {
				$exists: 1,
			},
			status: {
				$in: ['online', 'away', 'busy'],
			},
		};

		return this.find(query, options);
	}

	/**
	 * @param {import('mongodb').Filter<import('@rocket.chat/core-typings').IStats>} fields
	 */
	getOldest(fields = { _id: 1 }) {
		const query = {
			_id: {
				$ne: 'rocket.cat',
			},
		};

		const options = {
			fields,
			sort: {
				createdAt: 1,
			},
		};

		return this.findOne(query, options);
	}

	findRemote(options = {}) {
		return this.find({ isRemote: true }, options);
	}

	findActiveRemote(options = {}) {
		return this.find(
			{
				active: true,
				isRemote: true,
				roles: { $ne: ['guest'] },
			},
			options,
		);
	}

	getSAMLByIdAndSAMLProvider(_id, provider) {
		return this.findOne(
			{
				_id,
				'services.saml.provider': provider,
			},
			{
				'services.saml': 1,
			},
		);
	}

	findBySAMLNameIdOrIdpSession(nameID, idpSession) {
		return this.find({
			$or: [{ 'services.saml.nameID': nameID }, { 'services.saml.idpSession': idpSession }],
		});
	}

	findBySAMLInResponseTo(inResponseTo) {
		return this.find({
			'services.saml.inResponseTo': inResponseTo,
		});
	}

	// UPDATE
	addImportIds(_id, importIds) {
		importIds = [].concat(importIds);

		const query = { _id };

		const update = {
			$addToSet: {
				importIds: {
					$each: importIds,
				},
			},
		};

		return this.update(query, update);
	}

	updateInviteToken(_id, inviteToken) {
		const update = {
			$set: {
				inviteToken,
			},
		};

		return this.update(_id, update);
	}

	updateStatusText(_id, statusText) {
		const update = {
			$set: {
				statusText,
			},
		};

		return this.update(_id, update);
	}

	updateLastLoginById(_id) {
		const update = {
			$set: {
				lastLogin: new Date(),
			},
		};

		return this.update(_id, update);
	}

	updateStatusById(_id, status) {
		const update = {
			$set: {
				status,
			},
		};

		return this.update(_id, update);
	}

	addPasswordToHistory(_id, password) {
		const update = {
			$push: {
				'services.passwordHistory': {
					$each: [password],
					$slice: -Number(settings.get('Accounts_Password_History_Amount')),
				},
			},
		};
		return this.update(_id, update);
	}

	setServiceId(_id, serviceName, serviceId) {
		const update = { $set: {} };

		const serviceIdKey = `services.${serviceName}.id`;
		update.$set[serviceIdKey] = serviceId;

		return this.update(_id, update);
	}

	setUsername(_id, username) {
		const update = { $set: { username } };

		return this.update(_id, update);
	}

	setEmail(_id, email) {
		const update = {
			$set: {
				emails: [
					{
						address: email,
						verified: false,
					},
				],
			},
		};

		return this.update(_id, update);
	}

	setEmailVerified(_id, email) {
		const query = {
			_id,
			emails: {
				$elemMatch: {
					address: email,
					verified: false,
				},
			},
		};

		const update = {
			$set: {
				'emails.$.verified': true,
			},
		};

		return this.update(query, update);
	}

	setName(_id, name) {
		const update = {
			$set: {
				name,
			},
		};

		return this.update(_id, update);
	}

	unsetName(_id) {
		const update = {
			$unset: {
				name,
			},
		};

		return this.update(_id, update);
	}

	setCustomFields(_id, fields) {
		const values = {};
		Object.keys(fields).forEach((key) => {
			values[`customFields.${key}`] = fields[key];
		});

		const update = { $set: values };

		return this.update(_id, update);
	}

	setAvatarData(_id, origin, etag) {
		const update = {
			$set: {
				avatarOrigin: origin,
				avatarETag: etag,
			},
		};

		return this.update(_id, update);
	}

	unsetAvatarData(_id) {
		const update = {
			$unset: {
				avatarOrigin: 1,
				avatarETag: 1,
			},
		};

		return this.update(_id, update);
	}

	setUserActive(_id, active) {
		if (active == null) {
			active = true;
		}
		const update = {
			$set: {
				active,
			},
		};

		return this.update(_id, update);
	}

	setAllUsersActive(active) {
		const update = {
			$set: {
				active,
			},
		};

		return this.update({}, update, { multi: true });
	}

	/**
	 * @param latestLastLoginDate
	 * @param {IRole['_id']} role the role id
	 * @param {boolean} active
	 */
	setActiveNotLoggedInAfterWithRole(latestLastLoginDate, role = 'user', active = false) {
		const neverActive = { lastLogin: { $exists: 0 }, createdAt: { $lte: latestLastLoginDate } };
		const idleTooLong = { lastLogin: { $lte: latestLastLoginDate } };

		const query = {
			$or: [neverActive, idleTooLong],
			active: true,
			roles: role,
		};

		const update = {
			$set: {
				active,
			},
		};

		return this.update(query, update, { multi: true });
	}

	unsetLoginTokens(_id) {
		const update = {
			$set: {
				'services.resume.loginTokens': [],
			},
		};

		return this.update(_id, update);
	}

	unsetRequirePasswordChange(_id) {
		const update = {
			$unset: {
				requirePasswordChange: true,
				requirePasswordChangeReason: true,
			},
		};

		return this.update(_id, update);
	}

	resetPasswordAndSetRequirePasswordChange(_id, requirePasswordChange, requirePasswordChangeReason) {
		const update = {
			$unset: {
				'services.password': 1,
			},
			$set: {
				requirePasswordChange,
				requirePasswordChangeReason,
			},
		};

		return this.update(_id, update);
	}

	setLanguage(_id, language) {
		const update = {
			$set: {
				language,
			},
		};

		return this.update(_id, update);
	}

	setProfile(_id, profile) {
		const update = {
			$set: {
				'settings.profile': profile,
			},
		};

		return this.update(_id, update);
	}

	setBio(_id, bio = '') {
		const update = {
			...(bio.trim()
				? {
						$set: {
							bio,
						},
				  }
				: {
						$unset: {
							bio: 1,
						},
				  }),
		};
		return this.update(_id, update);
	}

	setNickname(_id, nickname = '') {
		const update = {
			...(nickname.trim()
				? {
						$set: {
							nickname,
						},
				  }
				: {
						$unset: {
							nickname: 1,
						},
				  }),
		};
		return this.update(_id, update);
	}

	clearSettings(_id) {
		const update = {
			$set: {
				settings: {},
			},
		};

		return this.update(_id, update);
	}

	setPreferences(_id, preferences) {
		const settingsObject = Object.assign(
			{},
			...Object.keys(preferences).map((key) => ({
				[`settings.preferences.${key}`]: preferences[key],
			})),
		);

		const update = {
			$set: settingsObject,
		};
		if (parseInt(preferences.clockMode) === 0) {
			delete update.$set['settings.preferences.clockMode'];
			update.$unset = { 'settings.preferences.clockMode': 1 };
		}

		return this.update(_id, update);
	}

	setTwoFactorAuthorizationHashAndUntilForUserIdAndToken(_id, token, hash, until) {
		return this.update(
			{
				_id,
				'services.resume.loginTokens.hashedToken': token,
			},
			{
				$set: {
					'services.resume.loginTokens.$.twoFactorAuthorizedHash': hash,
					'services.resume.loginTokens.$.twoFactorAuthorizedUntil': until,
				},
			},
		);
	}

	setUtcOffset(_id, utcOffset) {
		const query = {
			_id,
			utcOffset: {
				$ne: utcOffset,
			},
		};

		const update = {
			$set: {
				utcOffset,
			},
		};

		return this.update(query, update);
	}

	saveUserById(_id, data) {
		const setData = {};
		const unsetData = {};

		if (data.name != null) {
			if (!_.isEmpty(s.trim(data.name))) {
				setData.name = s.trim(data.name);
			} else {
				unsetData.name = 1;
			}
		}

		if (data.email != null) {
			if (!_.isEmpty(s.trim(data.email))) {
				setData.emails = [{ address: s.trim(data.email) }];
			} else {
				unsetData.emails = 1;
			}
		}

		if (data.phone != null) {
			if (!_.isEmpty(s.trim(data.phone))) {
				setData.phone = [{ phoneNumber: s.trim(data.phone) }];
			} else {
				unsetData.phone = 1;
			}
		}

		const update = {};

		if (!_.isEmpty(setData)) {
			update.$set = setData;
		}

		if (!_.isEmpty(unsetData)) {
			update.$unset = unsetData;
		}

		if (_.isEmpty(update)) {
			return true;
		}

		return this.update({ _id }, update);
	}

	setReason(_id, reason) {
		const update = {
			$set: {
				reason,
			},
		};

		return this.update(_id, update);
	}

	unsetReason(_id) {
		const update = {
			$unset: {
				reason: true,
			},
		};

		return this.update(_id, update);
	}

	bannerExistsById(_id, bannerId) {
		const query = {
			_id,
			[`banners.${bannerId}`]: {
				$exists: true,
			},
		};

		return this.find(query).count() !== 0;
	}

	setBannerReadById(_id, bannerId) {
		const update = {
			$set: {
				[`banners.${bannerId}.read`]: true,
			},
		};

		return this.update({ _id }, update);
	}

	removeBannerById(_id, banner) {
		const update = {
			$unset: {
				[`banners.${banner.id}`]: true,
			},
		};

		return this.update({ _id }, update);
	}

	removeSamlServiceSession(_id) {
		const update = {
			$unset: {
				'services.saml.idpSession': '',
			},
		};

		return this.update({ _id }, update);
	}

	updateDefaultStatus(_id, statusDefault) {
		return this.update(
			{
				_id,
				statusDefault: { $ne: statusDefault },
			},
			{
				$set: {
					statusDefault,
				},
			},
		);
	}

	setSamlInResponseTo(_id, inResponseTo) {
		this.update(
			{
				_id,
			},
			{
				$set: {
					'services.saml.inResponseTo': inResponseTo,
				},
			},
		);
	}

	// INSERT
	create(data) {
		const user = {
			createdAt: new Date(),
			avatarOrigin: 'none',
		};

		_.extend(user, data);

		return this.insert(user);
	}

	// REMOVE
	removeById(_id) {
		return this.remove(_id);
	}

	removeLivechatData(userId) {
		const query = {
			_id: userId,
		};

		const update = {
			$unset: {
				livechat: true,
			},
		};

		return this.update(query, update);
	}

	/*
Find users to send a message by email if:
- he is not online
- has a verified email
- has not disabled email notifications
- `active` is equal to true (false means they were deactivated and can't login)
*/
	getUsersToSendOfflineEmail(usersIds) {
		const query = {
			'_id': {
				$in: usersIds,
			},
			'active': true,
			'status': 'offline',
			'statusConnection': {
				$ne: 'online',
			},
			'emails.verified': true,
		};

		const options = {
			fields: {
				'name': 1,
				'username': 1,
				'emails': 1,
				'settings.preferences.emailNotificationMode': 1,
				'language': 1,
			},
		};

		return this.find(query, options);
	}

	countActiveUsersByService(serviceName, options) {
		const query = {
			active: true,
			type: { $nin: ['app'] },
			roles: { $ne: ['guest'] },
			[`services.${serviceName}`]: { $exists: true },
		};

		return this.find(query, options).count();
	}

	getActiveLocalUserCount() {
		return this.findActive().count() - this.findActiveRemote().count();
	}

	getActiveLocalGuestCount(idExceptions = []) {
		return this.findActiveLocalGuests(idExceptions).count();
	}

	removeOlderResumeTokensByUserId(userId, fromDate) {
		this.update(userId, {
			$pull: {
				'services.resume.loginTokens': {
					when: { $lt: fromDate },
				},
			},
		});
	}

	findAllUsersWithPendingAvatar() {
		const query = {
			_pendingAvatarUrl: {
				$exists: true,
			},
		};

		const options = {
			fields: {
				_id: 1,
				name: 1,
				_pendingAvatarUrl: 1,
			},
		};

		return this.find(query, options);
	}

	updateCustomFieldsById(userId, customFields) {
		return this.update(userId, {
			$set: {
				customFields,
			},
		});
	}
}

export default new Users(Meteor.users, true);
