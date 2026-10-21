import { ClientSafeError } from '@rocket.chat/core-services';
import type { IMessage, IRoom, ISecurityLabel, IUser } from '@rocket.chat/core-typings';
import { accessRequirement, canAccess, clearanceForPolicy, displayMarking, readerAccess, validateLabel } from '@rocket.chat/dcs';
import { Users } from '@rocket.chat/models';

import { getRoomClassificationBanner } from '../../../../server/api/lib/getRoomClassificationBanner';
import {
	applyMessageSecurityLabel,
	getReaderAccess,
	listUsersNotClearedFor,
	prepareMessagesForReader,
} from '../../../../server/lib/messages/securityLabels';
import { settings } from '../../../../server/settings';
import { policies } from '../../lib/dcs/policies';

const isEnabled = () => settings.get<boolean>('DCS_Enabled') === true;

const toStoredLabel = ({ policyId, classification, categories, creationDateTime }: ISecurityLabel): ISecurityLabel => ({
	policyId,
	classification,
	categories: categories.map(({ tagSetId, tagType, lacv }) => ({ tagSetId, tagType, lacv })),
	creationDateTime: creationDateTime instanceof Date ? creationDateTime : new Date(),
});

const settleLabel = async (message: IMessage, room: IRoom, user: Pick<IUser, '_id'>): Promise<IMessage> => {
	const { securityMarking: _marking, securityAccess: _access, ...rest } = message;
	const roomClearance = room.securityClearance;

	if (!roomClearance) {
		if (rest.securityLabel) {
			throw new ClientSafeError('error-dcs-room-not-labeled', 'This room does not accept security labels');
		}
		return rest;
	}

	const label = rest.securityLabel ?? room.defaultSecurityLabel;
	if (!label) {
		throw new ClientSafeError('error-dcs-label-required', 'Messages in this room need a security label');
	}

	const policy = policies.find(label.policyId);
	if (!policy) {
		throw new ClientSafeError('error-dcs-unknown-policy', 'The security label uses an unknown security policy');
	}
	if (validateLabel(policy, label).length) {
		throw new ClientSafeError('error-dcs-invalid-label', 'The security label is not valid under its security policy');
	}
	if (!canAccess(policy, label, roomClearance)) {
		throw new ClientSafeError('error-dcs-label-not-allowed-in-room', 'This room may not carry messages with this security label');
	}

	const sender = await Users.findOneById<Pick<IUser, 'securityClearances'>>(user._id, { projection: { securityClearances: 1 } });
	const senderClearance = clearanceForPolicy(sender?.securityClearances, policy.id);
	if (!senderClearance || !canAccess(policy, label, senderClearance)) {
		throw new ClientSafeError('error-dcs-not-cleared-for-label', 'You are not cleared for this security label');
	}

	const securityLabel = toStoredLabel(label);
	return { ...rest, securityLabel, securityAccess: accessRequirement(policy, securityLabel) };
};

const isCleared = (label: ISecurityLabel, clearances: IUser['securityClearances']): boolean => {
	const policy = policies.find(label.policyId);
	const clearance = clearanceForPolicy(clearances, label.policyId);
	return Boolean(policy && clearance && canAccess(policy, label, clearance));
};

const prepareForReader = async <T extends Partial<IMessage>>(messages: T[], uid?: IUser['_id']): Promise<T[]> => {
	if (!messages.some(({ securityLabel }) => securityLabel)) {
		return messages;
	}

	const reader = uid
		? await Users.findOneById<Pick<IUser, 'securityClearances' | 'language'>>(uid, { projection: { securityClearances: 1, language: 1 } })
		: null;

	return messages.flatMap((message) => {
		const label = message.securityLabel;
		if (!label) {
			return [message];
		}
		const policy = policies.find(label.policyId);
		if (!policy || !isCleared(label, reader?.securityClearances)) {
			return [];
		}
		return [{ ...message, securityMarking: displayMarking(policy, label, { lang: reader?.language }) }];
	});
};

const notClearedAmong = async (message: Pick<IMessage, 'securityLabel'>, userIds: IUser['_id'][]): Promise<IUser['_id'][]> => {
	const label = message.securityLabel;
	if (!label || !userIds.length) {
		return [];
	}
	const users = await Users.findByIds<Pick<IUser, '_id' | 'securityClearances'>>(userIds, {
		projection: { securityClearances: 1 },
	}).toArray();
	const cleared = new Set(users.filter((user) => isCleared(label, user.securityClearances)).map(({ _id }) => _id));
	return userIds.filter((uid) => !cleared.has(uid));
};

/**
 * Turns on enforcement of message security labels, and returns how to turn it off again.
 */
export const registerDcsHooks = (): (() => void) => {
	const unregister = [
		applyMessageSecurityLabel.patch((next, message, room, user) =>
			isEnabled() ? settleLabel(message, room, user) : next(message, room, user),
		),
		prepareMessagesForReader.patch((next, messages, uid) => (isEnabled() ? prepareForReader(messages, uid) : next(messages, uid))),
		listUsersNotClearedFor.patch((next, message, userIds) => (isEnabled() ? notClearedAmong(message, userIds) : next(message, userIds))),
		getReaderAccess.patch(async (next, uid) => {
			if (!isEnabled() || !uid) {
				return next(uid);
			}
			const reader = await Users.findOneById<Pick<IUser, 'securityClearances'>>(uid, { projection: { securityClearances: 1 } });
			return readerAccess(reader?.securityClearances);
		}),
		getRoomClassificationBanner.patch(async (next, room) => {
			const label = room.defaultSecurityLabel;
			const policy = label && policies.find(label.policyId);
			if (!isEnabled() || !room.securityClearance || !label || !policy) {
				return next(room);
			}
			const marking = displayMarking(policy, label);
			return {
				text: marking.text,
				segments: [],
				backgroundColor: marking.bgcolor,
				color: marking.fgcolor,
				style: 'classic',
				uppercase: true,
				monospace: false,
			};
		}),
	];

	return () => unregister.forEach((stop) => stop());
};
