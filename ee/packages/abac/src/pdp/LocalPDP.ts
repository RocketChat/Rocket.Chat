import { LDAPEnterprise } from '@rocket.chat/core-services';
import type { AbacActor, AbacRoomMembershipPreviewPage } from '@rocket.chat/core-services';
import type { AbacMembershipVerdict, AbacPreviewCursor, IAbacAttributeDefinition, IRoom, AtLeast, IUser } from '@rocket.chat/core-typings';
import { Rooms, Users } from '@rocket.chat/models';

import { AbacInvalidAttributeValuesError, OnlyCompliantCanBeAddedToRoomError } from '../errors';
import {
	PREVIEW_READ_OPTIONS,
	buildCompliantConditions,
	buildNonCompliantConditions,
	buildRoomNonCompliantConditionsFromSubject,
	findOwnedValues,
	findUnownedValues,
	previewRoomMembersInSteps,
	withAttributeValues,
} from '../helper';
import type { PreviewSubject } from '../helper';
import type { AttributeSetChange, EvaluableSubject, Evaluation, IPolicyDecisionPoint, ReevaluationUser, RoomMembersPreview } from './types';

export const LOCAL_PREVIEW_PAGE_SIZE = 1000;

export class LocalPDP implements IPolicyDecisionPoint {
	constructor(private restrictToOwnedAttributes = false) {}

	setRestrictToOwnedAttributes(value: boolean): void {
		this.restrictToOwnedAttributes = value;
	}

	async isAvailable(): Promise<boolean> {
		return true;
	}

	async getHealthStatus(): Promise<void> {
		// Local PDP is always available, nothing to check
	}

	async canAccessObject(
		room: AtLeast<IRoom, '_id' | 'abacAttributes'>,
		user: AtLeast<IUser, '_id'>,
	): Promise<{ granted: boolean; userToRemove?: IUser }> {
		const isUserCompliant = await Users.findOne(
			{
				_id: user._id,
				$and: buildCompliantConditions(room.abacAttributes ?? []),
			},
			{ projection: { _id: 1 } },
		);

		if (!isUserCompliant) {
			const fullUser = await Users.findOneById(user._id);
			if (!fullUser) {
				return { granted: false };
			}

			return { granted: false, userToRemove: fullUser };
		}

		return { granted: true };
	}

	async onRoomAttributesChanged(
		room: AtLeast<IRoom, '_id' | 't' | 'teamMain' | 'abacAttributes'>,
		newAttributes: IAbacAttributeDefinition[],
	): Promise<IUser[]> {
		const query = {
			__rooms: room._id,
			$or: buildNonCompliantConditions(newAttributes),
		};

		return Users.find(query, { projection: { __rooms: 0 } }).toArray();
	}

	needsEvaluation({ added }: AttributeSetChange): boolean {
		return added;
	}

	async previewRoomMembers(
		room: AtLeast<IRoom, '_id' | 'abacAttributes'>,
		attributes: IAbacAttributeDefinition[],
		{ filter, after, group }: AbacRoomMembershipPreviewPage,
	): Promise<RoomMembersPreview> {
		const count = LOCAL_PREVIEW_PAGE_SIZE;
		if (!group) {
			return previewRoomMembersInSteps(room._id, { filter, after, group, count }, (subjects) =>
				this.evaluateSubjectsAgainstAttributes(subjects, attributes, room),
			);
		}

		const loses = group === 'loses';
		const read = await Users.findActiveByRoomIdAfterUsername<PreviewSubject>(
			room._id,
			{
				search: filter,
				after,
				match: loses ? { $or: buildNonCompliantConditions(attributes) } : { $and: buildCompliantConditions(attributes) },
				limit: count + 1,
			},
			PREVIEW_READ_OPTIONS,
		).toArray();
		const verdict: AbacMembershipVerdict = loses ? 'nonCompliant' : 'compliant';
		const members = read.slice(0, count).map(({ _id, username, name }) => ({ _id, username, name, verdict }));

		const last = members.at(-1);
		const next = read.length > count && last?.username ? { _id: last._id, username: last.username } : undefined;
		const countUntil = (until?: AbacPreviewCursor) => Users.countActiveByRoomIdAfterUsername(room._id, { search: filter, after, until });

		if (!next) {
			const remaining = await countUntil();
			return { members, checked: remaining, ...(!after && { total: remaining }) };
		}

		const [checked, total] = await Promise.all([countUntil(next), after ? undefined : countUntil()]);
		return { members, checked, ...(total !== undefined && { total }), next };
	}

	async onSubjectAttributesChanged(user: IUser, _next: IAbacAttributeDefinition[]): Promise<Pick<IRoom, '_id' | 'name'>[]> {
		const roomIds = user.__rooms;

		// No attributes: no rooms :(
		if (!_next.length) {
			return Rooms.find(
				{
					_id: { $in: roomIds },
					abacAttributes: { $exists: true, $ne: [] },
				},
				{ projection: { _id: 1, name: 1 } },
			).toArray();
		}

		const query = {
			_id: { $in: roomIds },
			$or: buildRoomNonCompliantConditionsFromSubject(_next),
		};

		return Rooms.find(query, { projection: { _id: 1, name: 1 } }).toArray();
	}

	async evaluateUserRooms(
		_entries: Array<{
			user: Pick<IUser, '_id' | 'emails' | 'username'>;
			rooms: AtLeast<IRoom, '_id' | 'abacAttributes'>[];
		}>,
	): Promise<Array<{ user: Pick<IUser, '_id' | 'emails' | 'username'>; room: IRoom }>> {
		throw new Error('evaluateUserRooms is not implemented for LocalPDP');
	}

	async reevaluateUsers(users: ReevaluationUser[]): Promise<void> {
		await this.refreshSubjectAttributes(users.map((user) => user._id));
	}

	async refreshSubjectAttributes(userIds: string[]): Promise<void> {
		await LDAPEnterprise.syncUsersAbacAttributesByIds(userIds);
	}

	async checkUsernamesMatchAttributes(
		usernames: string[],
		attributes: IAbacAttributeDefinition[],
		_object: Pick<IRoom, '_id'>,
	): Promise<void> {
		const nonCompliantUsersFromList = await Users.find(
			{
				username: { $in: usernames },
				$or: buildNonCompliantConditions(attributes),
			},
			{ projection: { username: 1 } },
		)
			.map((u) => u.username as string)
			.toArray();

		const nonCompliantSet = new Set<string>(nonCompliantUsersFromList);

		if (nonCompliantSet.size) {
			throw new OnlyCompliantCanBeAddedToRoomError();
		}
	}

	async assertCreatorMayAssign(attributes: IAbacAttributeDefinition[], actor: AbacActor): Promise<{ creatorAdmitted: boolean }> {
		const unowned = await this.findUnassignableValues(attributes, actor);
		if (unowned.length) {
			throw new AbacInvalidAttributeValuesError({ attributes: unowned });
		}

		return { creatorAdmitted: false };
	}

	async findUnassignableValues(
		attributes: IAbacAttributeDefinition[],
		actor: AbacActor,
		alreadyAssigned: IAbacAttributeDefinition[] = [],
	): Promise<IAbacAttributeDefinition[]> {
		if (!this.restrictToOwnedAttributes) {
			return [];
		}

		return findUnownedValues(attributes, withAttributeValues(await this.heldAttributesOf(actor), alreadyAssigned));
	}

	async filterAssignableAttributes(
		definitions: IAbacAttributeDefinition[],
		actor: AbacActor,
		alreadyAssigned: IAbacAttributeDefinition[] = [],
	): Promise<IAbacAttributeDefinition[]> {
		if (!this.restrictToOwnedAttributes) {
			return definitions;
		}

		return findOwnedValues(definitions, withAttributeValues(await this.heldAttributesOf(actor), alreadyAssigned));
	}

	private async heldAttributesOf(actor: AbacActor): Promise<Map<string, Set<string>>> {
		const user = await Users.findOneById<Pick<IUser, 'abacAttributes'>>(actor._id, { projection: { abacAttributes: 1 } });
		return new Map((user?.abacAttributes ?? []).map(({ key, values }) => [key, new Set(values)]));
	}

	async evaluateSubjectsAgainstAttributes(
		subjects: EvaluableSubject[],
		attributes: IAbacAttributeDefinition[],
		_object: Pick<IRoom, '_id'>,
	): Promise<Evaluation> {
		const ids = subjects.map(({ _id }) => _id);

		if (!ids.length || !attributes.length) {
			return { compliant: ids, nonCompliant: [], inconclusive: [] };
		}

		const nonCompliant = await Users.find({ _id: { $in: ids }, $or: buildNonCompliantConditions(attributes) }, { projection: { _id: 1 } })
			.map(({ _id }) => _id)
			.toArray();

		const denied = new Set(nonCompliant);

		return { compliant: ids.filter((id) => !denied.has(id)), nonCompliant, inconclusive: [] };
	}

	async evaluateSubjectAgainstRooms(subject: EvaluableSubject, rooms: AtLeast<IRoom, '_id' | 'abacAttributes'>[]): Promise<Evaluation> {
		const ids = rooms.map(({ _id }) => _id);

		if (!ids.length) {
			return { compliant: [], nonCompliant: [], inconclusive: [] };
		}

		const compliant = await Rooms.find(
			{ _id: { $in: ids }, $nor: buildRoomNonCompliantConditionsFromSubject(subject.abacAttributes ?? []) },
			{ projection: { _id: 1 } },
		)
			.map(({ _id }) => _id)
			.toArray();

		const permitted = new Set(compliant);

		return { compliant, nonCompliant: ids.filter((id) => !permitted.has(id)), inconclusive: [] };
	}
}
