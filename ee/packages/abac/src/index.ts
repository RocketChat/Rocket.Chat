import { api, Room, ServiceClass, Settings } from '@rocket.chat/core-services';
import type { AbacActor, IAbacService } from '@rocket.chat/core-services';
import { AbacAccessOperation, AbacObjectType } from '@rocket.chat/core-typings';
import type {
	IAbacAttribute,
	IAbacAttributeDefinition,
	IRoom,
	AtLeast,
	IUser,
	ILDAPEntry,
	AbacAuditReason,
} from '@rocket.chat/core-typings';
import { Rooms, AbacAttributes, Users, Subscriptions } from '@rocket.chat/models';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import { isTruthy } from '@rocket.chat/tools';
import type { Document, UpdateFilter } from 'mongodb';
import pLimit from 'p-limit';

import { Audit } from './audit';
import {
	AbacAttributeInUseError,
	AbacAttributeNotFoundError,
	AbacDuplicateAttributeKeyError,
	AbacInvalidAttributeValuesError,
	AbacUnsupportedObjectTypeError,
	AbacUnsupportedOperationError,
	PdpUnavailableError,
	PdpHealthCheckError,
} from './errors';
import {
	getAbacRoom,
	diffAttributes,
	extractAttribute,
	diffAttributeSets,
	validateAndNormalizeAttributes,
	ensureAttributeDefinitionsExist,
	MAX_ABAC_ATTRIBUTE_KEYS,
} from './helper';
import { logger } from './logger';
import type { IPolicyDecisionPoint, VirtruPDPConfig } from './pdp';
import { LocalPDP, VirtruPDP } from './pdp';

// Limit concurrent user removals to avoid overloading the server with too many operations at once
const limit = pLimit(20);

const stripTrailingSlashes = (value: string): string => value.replace(/\/+$/, '');

export class AbacService extends ServiceClass implements IAbacService {
	protected name = 'abac';

	private pdp: IPolicyDecisionPoint | null = null;

	private virtruPdpConfig: VirtruPDPConfig = {
		baseUrl: '',
		clientId: '',
		clientSecret: '',
		oidcEndpoint: '',
		defaultEntityKey: 'emailAddress',
		attributeNamespace: 'example.com',
	};

	decisionCacheTimeout = 60; // seconds

	constructor() {
		super();

		this.onSettingChanged('ABAC_PDP_Type', async ({ setting }): Promise<void> => {
			const { value } = setting;
			if (value !== 'local' && value !== 'virtru') {
				return;
			}

			if (value === 'virtru') {
				await this.loadVirtruPdpConfig();
			}

			this.setPdpStrategy(value);
		});

		this.onSettingChanged('Abac_Cache_Decision_Time_Seconds', async ({ setting }): Promise<void> => {
			const { value } = setting;
			if (typeof value !== 'number') {
				return;
			}
			this.decisionCacheTimeout = value;
		});

		this.onSettingChanged('ABAC_Virtru_Base_URL', async ({ setting }): Promise<void> => {
			this.virtruPdpConfig.baseUrl = stripTrailingSlashes(setting.value as string);
			this.syncVirtruPdpConfig();
		});

		this.onSettingChanged('ABAC_Virtru_Client_ID', async ({ setting }): Promise<void> => {
			this.virtruPdpConfig.clientId = setting.value as string;
			this.syncVirtruPdpConfig();
		});

		this.onSettingChanged('ABAC_Virtru_Client_Secret', async ({ setting }): Promise<void> => {
			this.virtruPdpConfig.clientSecret = setting.value as string;
			this.syncVirtruPdpConfig();
		});

		this.onSettingChanged('ABAC_Virtru_OIDC_Endpoint', async ({ setting }): Promise<void> => {
			this.virtruPdpConfig.oidcEndpoint = stripTrailingSlashes(setting.value as string);
			this.syncVirtruPdpConfig();
		});

		this.onSettingChanged('ABAC_Virtru_Default_Entity_Key', async ({ setting }): Promise<void> => {
			this.virtruPdpConfig.defaultEntityKey = setting.value as VirtruPDPConfig['defaultEntityKey'];
			this.syncVirtruPdpConfig();
		});

		this.onSettingChanged('ABAC_Virtru_Attribute_Namespace', async ({ setting }): Promise<void> => {
			this.virtruPdpConfig.attributeNamespace = setting.value as string;
			this.syncVirtruPdpConfig();
		});
	}

	private async loadVirtruPdpConfig(): Promise<void> {
		const [baseUrl, clientId, clientSecret, oidcEndpoint, defaultEntityKey, attributeNamespace] = await Promise.all([
			Settings.get<string>('ABAC_Virtru_Base_URL'),
			Settings.get<string>('ABAC_Virtru_Client_ID'),
			Settings.get<string>('ABAC_Virtru_Client_Secret'),
			Settings.get<string>('ABAC_Virtru_OIDC_Endpoint'),
			Settings.get<string>('ABAC_Virtru_Default_Entity_Key'),
			Settings.get<string>('ABAC_Virtru_Attribute_Namespace'),
		]);

		this.virtruPdpConfig = {
			baseUrl: stripTrailingSlashes(baseUrl || ''),
			clientId: clientId || '',
			clientSecret: clientSecret || '',
			oidcEndpoint: stripTrailingSlashes(oidcEndpoint || ''),
			defaultEntityKey: (defaultEntityKey as VirtruPDPConfig['defaultEntityKey']) || 'emailAddress',
			attributeNamespace: attributeNamespace || 'example.com',
		};
	}

	private syncVirtruPdpConfig(): void {
		if (this.pdp instanceof VirtruPDP) {
			this.pdp.updateConfig({ ...this.virtruPdpConfig });
		}
	}

	setPdpStrategy(strategy: 'local' | 'virtru'): void {
		const previousPdp = this.pdp ? this.pdp.constructor.name : 'none';

		switch (strategy) {
			case 'virtru':
				this.pdp = new VirtruPDP({ ...this.virtruPdpConfig });
				this.pdpType = 'virtru';
				break;
			case 'local':
			default:
				this.pdp = new LocalPDP();
				this.pdpType = 'local';
				break;
		}

		logger.debug({
			msg: 'PDP strategy changed',
			from: previousPdp,
			to: this.pdp.constructor.name,
			requestedStrategy: strategy,
		});
	}

	override async started(): Promise<void> {
		this.decisionCacheTimeout = await Settings.get<number>('Abac_Cache_Decision_Time_Seconds');

		const pdpType = await Settings.get<string>('ABAC_PDP_Type');
		if (pdpType !== 'virtru') {
			this.setPdpStrategy('local');
			return;
		}

		await this.loadVirtruPdpConfig();
		this.setPdpStrategy('virtru');
	}

	async addSubjectAttributes(user: IUser, ldapUser: ILDAPEntry, map: Record<string, string>): Promise<void> {
		if (!user?._id) {
			return;
		}

		const entries = Object.entries(map || {});

		const mergedMap = new Map<string, Set<string>>();
		for (const [ldapKey, abacKey] of entries) {
			const attr = extractAttribute(ldapUser, ldapKey, abacKey);
			if (!attr) {
				continue;
			}
			const existing = mergedMap.get(attr.key);
			if (!existing) {
				mergedMap.set(attr.key, new Set(attr.values));
				continue;
			}
			for (const v of attr.values) {
				existing.add(v);
			}
		}
		const finalAttributes = Array.from(mergedMap.entries()).map<IAbacAttributeDefinition>(([key, valuesSet]) => ({
			key,
			values: Array.from(valuesSet),
		}));

		if (!finalAttributes.length) {
			if (Array.isArray(user.abacAttributes) && user.abacAttributes.length) {
				const finalUser = await Users.unsetAbacAttributesById(user._id);
				await this.onSubjectAttributesChanged(finalUser!, []);
				void Audit.subjectAttributeChanged([], { _id: user._id, username: user.username });
			}
			return;
		}

		const finalUser = await Users.setAbacAttributesById(user._id, finalAttributes);

		if (diffAttributeSets(user?.abacAttributes || [], finalAttributes).removed) {
			await this.onSubjectAttributesChanged(finalUser!, finalAttributes);
		}

		const diff = diffAttributes(user?.abacAttributes, finalAttributes);
		if (diff.length) {
			void Audit.subjectAttributeChanged(diff, { _id: user._id, username: user.username });
		}
	}

	async addAbacAttribute(attribute: IAbacAttributeDefinition, actor: AbacActor): Promise<void> {
		if (!attribute.values.length) {
			throw new AbacInvalidAttributeValuesError();
		}

		try {
			await AbacAttributes.insertOne(attribute);
			void Audit.attributeCreated(attribute, actor);
		} catch (e) {
			if (e instanceof Error && e.message.includes('E11000')) {
				throw new AbacDuplicateAttributeKeyError();
			}
			throw e;
		}
	}

	async listAbacAttributes(filters?: { key?: string; values?: string; offset?: number; count?: number }): Promise<{
		attributes: IAbacAttribute[];
		offset: number;
		count: number;
		total: number;
	}> {
		const query: Document[] = [];
		if (filters?.key) {
			query.push({ key: new RegExp(escapeRegExp(filters.key), 'i') });
		}
		if (filters?.values?.length) {
			query.push({ values: new RegExp(escapeRegExp(filters.values), 'i') });
		}

		const offset = filters?.offset ?? 0;
		const limit = filters?.count ?? 25;

		const { cursor, totalCount } = AbacAttributes.findPaginated(
			{ ...(query.length && { $or: query }) },
			{
				projection: { key: 1, values: 1 },
				skip: offset,
				limit,
			},
		);

		const attributes = await cursor.toArray();

		return {
			attributes,
			offset,
			count: attributes.length,
			total: await totalCount,
		};
	}

	async listAbacRooms(filters?: {
		offset?: number;
		count?: number;
		filter?: string;
		filterType?: 'all' | 'roomName' | 'attribute' | 'value';
	}): Promise<{
		rooms: IRoom[];
		offset: number;
		count: number;
		total: number;
	}> {
		const offset = filters?.offset ?? 0;
		const limit = filters?.count ?? 25;

		const baseQuery: Document = {
			t: 'p',
			abacAttributes: { $exists: true, $ne: [] },
		};

		const { filter, filterType } = filters || {};

		if (filter?.trim().length) {
			const regex = new RegExp(escapeRegExp(filter.trim()), 'i');

			let condition: Document;

			switch (filterType) {
				case 'roomName':
					condition = { $or: [{ name: regex }, { fname: regex }] };
					break;
				case 'attribute':
					condition = { 'abacAttributes.key': regex };
					break;
				case 'value':
					condition = { 'abacAttributes.values': regex };
					break;
				case 'all':
				default:
					condition = {
						$or: [{ name: regex }, { fname: regex }, { 'abacAttributes.key': regex }, { 'abacAttributes.values': regex }],
					};
					break;
			}

			Object.assign(baseQuery, condition);
		}

		const { cursor, totalCount } = Rooms.findPaginated(baseQuery, {
			skip: offset,
			limit,
			sort: { name: 1 },
		});

		const rooms = await cursor.toArray();

		return {
			rooms,
			offset,
			count: rooms.length,
			total: await totalCount,
		};
	}

	async updateAbacAttributeById(_id: string, update: { key?: string; values?: string[] }, actor: AbacActor): Promise<void> {
		if (!update.key && !update.values) {
			return;
		}

		const existing = await AbacAttributes.findOneById(_id, { projection: { key: 1, values: 1 } });
		if (!existing) {
			throw new AbacAttributeNotFoundError();
		}

		if (update.values && !update.values.length) {
			throw new AbacInvalidAttributeValuesError();
		}

		const newKey = update.key ?? existing.key;
		const newValues = update.values ?? existing.values;

		const removedValues = existing.values.filter((v) => !newValues.includes(v));
		const keyChanged = newKey !== existing.key;

		const valuesToCheck = keyChanged ? existing.values : removedValues;

		if (keyChanged || valuesToCheck.length) {
			const inUse = await Rooms.isAbacAttributeInUse(existing.key, valuesToCheck.length ? valuesToCheck : existing.values);
			if (inUse) {
				throw new AbacAttributeInUseError();
			}
		}

		const modifier: UpdateFilter<IAbacAttribute> = {};
		if (update.key) {
			modifier.key = update.key;
		}
		if (update.values) {
			modifier.values = update.values;
		}

		if (!Object.keys(modifier).length) {
			return;
		}

		try {
			await AbacAttributes.updateOne({ _id }, { $set: modifier });
			void Audit.attributeUpdated(existing, modifier as IAbacAttributeDefinition, actor);
		} catch (e) {
			if (e instanceof Error && e.message.includes('E11000')) {
				throw new AbacDuplicateAttributeKeyError();
			}
			throw e;
		}
	}

	async deleteAbacAttributeById(_id: string, actor: AbacActor): Promise<void> {
		const existing = await AbacAttributes.findOneById(_id, { projection: { key: 1, values: 1 } });
		if (!existing) {
			throw new AbacAttributeNotFoundError();
		}

		const inUse = await Rooms.isAbacAttributeInUse(existing.key, existing.values);
		if (inUse) {
			throw new AbacAttributeInUseError();
		}

		await AbacAttributes.removeById(_id);
		void Audit.attributeDeleted(existing, actor);
	}

	async getAbacAttributeById(_id: string, _actor: AbacActor | undefined): Promise<{ key: string; values: string[] }> {
		const attribute = await AbacAttributes.findOneById(_id, { projection: { key: 1, values: 1 } });
		if (!attribute) {
			throw new AbacAttributeNotFoundError();
		}

		return {
			key: attribute.key,
			values: attribute.values || [],
		};
	}

	async isAbacAttributeInUseByKey(key: string): Promise<boolean> {
		const attribute = await AbacAttributes.findOneByKey(key, { projection: { values: 1 } });
		if (!attribute) {
			return false;
		}
		return Rooms.isAbacAttributeInUse(key, attribute.values || []);
	}

	private broadcastRoomUpdate(room: IRoom): void {
		void api.broadcast('watch.rooms', { clientAction: 'updated', room });
	}

	async setRoomAbacAttributes(rid: string, attributes: Record<string, string[]>, actor: AbacActor): Promise<void> {
		await this.ensurePdpAvailable();
		const room = await getAbacRoom(rid);

		if (!Object.keys(attributes).length && room.abacAttributes?.length) {
			await Rooms.unsetAbacAttributesById(rid);
			void Audit.objectAttributesRemoved({ _id: room._id, name: room.name }, room.abacAttributes, actor);
			this.broadcastRoomUpdate({ ...room, abacAttributes: undefined });
			return;
		}

		const normalized = validateAndNormalizeAttributes(attributes);

		await ensureAttributeDefinitionsExist(normalized);

		const updated = await Rooms.setAbacAttributesById(rid, normalized);
		void Audit.objectAttributeChanged({ _id: room._id, name: room.name }, room.abacAttributes || [], normalized, 'updated', actor);

		if (updated) {
			this.broadcastRoomUpdate(updated);
		}

		const previous: IAbacAttributeDefinition[] = room.abacAttributes || [];
		if (diffAttributeSets(previous, normalized).added) {
			await this.onRoomAttributesChanged(room, updated?.abacAttributes ?? normalized);
		}
	}

	async updateRoomAbacAttributeValues(rid: string, key: string, values: string[], actor: AbacActor): Promise<void> {
		await this.ensurePdpAvailable();
		const room = await getAbacRoom(rid);

		const previous: IAbacAttributeDefinition[] = room.abacAttributes || [];

		const existingIndex = previous.findIndex((a) => a.key === key);
		const isNewKey = existingIndex === -1;
		if (isNewKey && previous.length >= MAX_ABAC_ATTRIBUTE_KEYS) {
			throw new AbacInvalidAttributeValuesError();
		}

		await ensureAttributeDefinitionsExist([{ key, values }]);

		if (isNewKey) {
			await Rooms.updateSingleAbacAttributeValuesById(rid, key, values);
			void Audit.objectAttributeChanged(
				{ _id: room._id, name: room.name },
				room.abacAttributes || [],
				[{ key, values }],
				'key-added',
				actor,
			);
			const next = [...previous, { key, values }];

			this.broadcastRoomUpdate({ ...room, abacAttributes: next });

			await this.onRoomAttributesChanged(room, next);
			return;
		}

		const prevValues = previous[existingIndex].values;

		if (prevValues.length === values.length && prevValues.every((v, i) => v === values[i])) {
			return;
		}

		const updated = await Rooms.updateAbacAttributeValuesArrayFilteredById(rid, key, values);
		void Audit.objectAttributeChanged(
			{ _id: room._id, name: room.name },
			room.abacAttributes || [],
			[{ key, values }],
			'key-updated',
			actor,
		);

		if (updated) {
			this.broadcastRoomUpdate(updated);
		}

		if (diffAttributeSets([previous[existingIndex]], [{ key, values }]).added) {
			const next = previous.map((a, i) => (i === existingIndex ? { key, values } : a));
			await this.onRoomAttributesChanged(room, next);
		}
	}

	async removeRoomAbacAttribute(rid: string, key: string, actor: AbacActor): Promise<void> {
		await this.ensurePdpAvailable();
		const room = await getAbacRoom(rid);

		const previous: IAbacAttributeDefinition[] = room.abacAttributes || [];
		const exists = previous.some((a) => a.key === key);
		if (!exists) {
			return;
		}

		// if is the last attribute, just remove all
		if (previous.length === 1) {
			await Rooms.unsetAbacAttributesById(rid);
			void Audit.objectAttributesRemoved({ _id: room._id }, previous, actor);

			this.broadcastRoomUpdate({ ...room, abacAttributes: undefined });

			return;
		}

		await Rooms.removeAbacAttributeByRoomIdAndKey(rid, key);
		const next = previous.filter((a) => a.key !== key);
		void Audit.objectAttributeRemoved({ _id: room._id, name: room.name }, previous, next, 'key-removed', actor);

		this.broadcastRoomUpdate({ ...room, abacAttributes: next });
	}

	async addRoomAbacAttributeByKey(rid: string, key: string, values: string[], actor: AbacActor): Promise<void> {
		await this.ensurePdpAvailable();
		await ensureAttributeDefinitionsExist([{ key, values }]);

		const room = await getAbacRoom(rid);

		const previous: IAbacAttributeDefinition[] = room.abacAttributes || [];
		if (previous.some((a) => a.key === key)) {
			throw new AbacDuplicateAttributeKeyError();
		}

		if (previous.length >= MAX_ABAC_ATTRIBUTE_KEYS) {
			throw new AbacInvalidAttributeValuesError();
		}

		const updated = await Rooms.insertAbacAttributeIfNotExistsById(rid, key, values);
		const next = updated?.abacAttributes || [...previous, { key, values }];

		void Audit.objectAttributeChanged({ _id: room._id, name: room.name }, previous, next, 'key-added', actor);

		this.broadcastRoomUpdate({ ...room, abacAttributes: next });

		await this.onRoomAttributesChanged(room, next);
	}

	async replaceRoomAbacAttributeByKey(rid: string, key: string, values: string[], actor: AbacActor): Promise<void> {
		await this.ensurePdpAvailable();
		await ensureAttributeDefinitionsExist([{ key, values }]);

		const room = await getAbacRoom(rid);

		const exists = room?.abacAttributes?.find((a) => a.key === key);

		if (exists) {
			const updated = await Rooms.updateAbacAttributeValuesArrayFilteredById(rid, key, values);

			void Audit.objectAttributeChanged(
				{ _id: room._id, name: room.name },
				room.abacAttributes || [],
				updated?.abacAttributes || [],
				'key-updated',
				actor,
			);

			if (updated) {
				this.broadcastRoomUpdate(updated);
			}

			if (diffAttributeSets([exists], [{ key, values }]).added) {
				await this.onRoomAttributesChanged(room, updated?.abacAttributes || []);
			}

			return;
		}

		if (room?.abacAttributes?.length === MAX_ABAC_ATTRIBUTE_KEYS) {
			throw new AbacInvalidAttributeValuesError();
		}

		const updated = await Rooms.insertAbacAttributeIfNotExistsById(rid, key, values);
		const nextAttributes = updated?.abacAttributes || [...(room.abacAttributes || []), { key, values }];
		void Audit.objectAttributeChanged({ _id: room._id, name: room.name }, room.abacAttributes || [], nextAttributes, 'key-added', actor);

		this.broadcastRoomUpdate({ ...room, abacAttributes: nextAttributes });

		await this.onRoomAttributesChanged(room, updated?.abacAttributes || []);
	}

	private shouldUseCache(userSub: { abacLastTimeChecked?: Date }): boolean {
		return (
			this.decisionCacheTimeout > 0 &&
			!!userSub.abacLastTimeChecked &&
			Date.now() - userSub.abacLastTimeChecked.getTime() < this.decisionCacheTimeout * 1000
		);
	}

	async canAccessObject(
		room: Pick<IRoom, '_id' | 't' | 'teamId' | 'prid' | 'abacAttributes'>,
		user: Pick<IUser, '_id'>,
		action: AbacAccessOperation,
		objectType: AbacObjectType,
	) {
		// We may need this flex for phase 2, but for now only ROOM/READ is supported
		if (objectType !== AbacObjectType.ROOM) {
			throw new AbacUnsupportedObjectTypeError();
		}

		if (action !== AbacAccessOperation.READ) {
			throw new AbacUnsupportedOperationError();
		}

		if (!user?._id || !room?.abacAttributes?.length) {
			return false;
		}

		if (!this.pdp) {
			return false;
		}

		const userSub = await Subscriptions.findOneByRoomIdAndUserId(room._id, user._id, { projection: { abacLastTimeChecked: 1 } });
		if (!userSub) {
			return false;
		}

		if (this.shouldUseCache(userSub)) {
			logger.debug({ msg: 'Using cached ABAC decision', userId: user._id, roomId: room._id });
			return true;
		}

		if (!(await this.pdp.isAvailable())) {
			return false;
		}

		let decision: { granted: boolean; userToRemove?: IUser };
		try {
			decision = await this.pdp.canAccessObject(room, user);
		} catch (err) {
			logger.error({ msg: 'PDP canAccessObject failed', userId: user._id, roomId: room._id, err });
			return false;
		}

		if (decision.userToRemove) {
			await this.removeUserFromRoom(room, decision.userToRemove, 'realtime-policy-eval');
		}

		if (decision.granted) {
			await Subscriptions.setAbacLastTimeCheckedByUserIdAndRoomId(user._id, room._id, new Date());
		}

		return decision.granted;
	}

	async checkUsernamesMatchAttributes(usernames: string[], attributes: IAbacAttributeDefinition[], object: IRoom): Promise<void> {
		if (!usernames.length || !attributes.length || !this.pdp) {
			return;
		}

		await this.ensurePdpAvailable();
		await this.pdp.checkUsernamesMatchAttributes(usernames, attributes, object);

		usernames.forEach((username) => {
			void Audit.actionPerformed({ username }, { _id: object._id, name: object.name }, 'system', 'granted-object-access');
		});
	}

	private pdpType: 'local' | 'virtru' = 'local';

	private async ensurePdpAvailable(): Promise<void> {
		if (!(await this.pdp?.isAvailable())) {
			throw new PdpUnavailableError();
		}
	}

	private async removeUserFromRoom(room: AtLeast<IRoom, '_id'>, user: IUser, reason: AbacAuditReason): Promise<void> {
		return Room.removeUserFromRoom(room._id, user, {
			skipAppPreEvents: true,
			customSystemMessage: 'abac-removed-user-from-room' as const,
		})
			.then(
				() =>
					void Audit.actionPerformed(
						{ _id: user._id, username: user.username },
						{ _id: room._id, name: room.name },
						reason,
						'revoked-object-access',
						this.pdpType,
					),
			)
			.catch((err) => {
				logger.error({
					msg: 'Failed to remove user from ABAC room',
					rid: room._id,
					err,
					reason,
				});
			});
	}

	protected async onRoomAttributesChanged(
		room: AtLeast<IRoom, '_id' | 't' | 'teamMain' | 'abacAttributes'>,
		newAttributes: IAbacAttributeDefinition[],
	): Promise<void> {
		const rid = room._id;
		if (!newAttributes?.length) {
			// When a room has no ABAC attributes, it becomes a normal private group and no user removal is necessary
			logger.warn({
				msg: 'Room ABAC attributes removed. Room is not abac managed anymore',
				rid,
			});

			return;
		}

		if (!this.pdp) {
			return;
		}

		try {
			const nonCompliantUsers = await this.pdp.onRoomAttributesChanged(room, newAttributes);

			if (!nonCompliantUsers.length) {
				return;
			}

			await Promise.all(nonCompliantUsers.map((user) => limit(() => this.removeUserFromRoom(room, user, 'room-attributes-change'))));
		} catch (err) {
			logger.error({
				msg: 'Failed to re-evaluate room subscriptions after ABAC attributes changed',
				rid,
				err,
			});
		}
	}

	protected async onSubjectAttributesChanged(user: IUser, _next: IAbacAttributeDefinition[]): Promise<void> {
		if (!user?._id || !Array.isArray(user.__rooms) || !user.__rooms.length || !this.pdp) {
			return;
		}

		if (!(await this.pdp.isAvailable())) {
			return;
		}

		try {
			const nonCompliantRooms = await this.pdp.onSubjectAttributesChanged(user, _next);

			if (!nonCompliantRooms.length) {
				return;
			}

			await Promise.all(nonCompliantRooms.map((room) => limit(() => this.removeUserFromRoom(room, user, 'ldap-sync'))));
		} catch (err) {
			logger.error({
				msg: 'Failed to query and remove user from non-compliant ABAC rooms',
				err,
			});
		}
	}

	async getPDPHealth(): Promise<void> {
		if (!this.pdp) {
			logger.warn({ msg: 'ABAC PDP health check: no PDP configured' });
			throw new PdpHealthCheckError('ABAC_PDP_Health_No_PDP');
		}

		await this.pdp.getHealthStatus();
	}

	async evaluateRoomMembership(): Promise<void> {
		if (!this.pdp || !(await this.pdp.isAvailable())) {
			return;
		}

		const abacRooms = await Rooms.findAllPrivateRoomsWithAbacAttributes({
			projection: { _id: 1, t: 1, teamMain: 1, abacAttributes: 1 },
		}).toArray();

		if (!abacRooms.length) {
			return;
		}

		const abacRoomById = Object.fromEntries(abacRooms.map((room) => [room._id, room]));
		const abacRoomIds = abacRooms.map((room) => room._id);

		const users = Users.findActiveByRoomIds(abacRoomIds, {
			projection: { _id: 1, emails: 1, username: 1, __rooms: 1 },
		});

		const entries = (
			await users
				.map((user) => {
					const rooms = (user.__rooms ?? []).map((rid) => abacRoomById[rid]).filter(Boolean);
					return rooms.length ? { user, rooms } : null;
				})
				.toArray()
		).filter(isTruthy);

		if (!entries.length) {
			return;
		}

		try {
			const nonCompliant = await this.pdp.evaluateUserRooms(entries);

			// TODO: this should be in a persistent queue
			await Promise.all(nonCompliant.map(({ user, room }) => limit(() => this.removeUserFromRoom(room, user as IUser, 'virtru-pdp-sync'))));
		} catch (err) {
			logger.error({ msg: 'Failed to evaluate room membership', err });
		}
	}
}

export { LocalPDP, VirtruPDP } from './pdp';
export type { IPolicyDecisionPoint, VirtruPDPConfig } from './pdp';
export { PdpHealthCheckError, getPdpHealthErrorCode } from './errors';

export default AbacService;
