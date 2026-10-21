import { ClientSafeError } from '@rocket.chat/core-services';
import type { IMessage, IRoom, ISecurityLabel, IUser } from '@rocket.chat/core-typings';
import { canAccess, clearanceForPolicy, displayMarking, validateLabel } from '@rocket.chat/dcs';
import { Users } from '@rocket.chat/models';

import { getRoomClassificationBanner } from '../../../../server/api/lib/getRoomClassificationBanner';
import { applyMessageSecurityLabel, redactMessagesForUser, toWithheldMessage } from '../../../../server/lib/messages/securityLabels';
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
	const { securityMarking: _marking, securityWithheld: _withheld, ...rest } = message;
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

	return { ...rest, securityLabel: toStoredLabel(label) };
};

const redact = async <T extends Partial<IMessage>>(messages: T[], uid?: IUser['_id']): Promise<T[]> => {
	if (!messages.some(({ securityLabel }) => securityLabel)) {
		return messages;
	}

	const reader = uid
		? await Users.findOneById<Pick<IUser, 'securityClearances' | 'language'>>(uid, { projection: { securityClearances: 1, language: 1 } })
		: null;

	return messages.map((message) => {
		const label = message.securityLabel;
		if (!label) {
			return message;
		}
		const policy = policies.find(label.policyId);
		const clearance = clearanceForPolicy(reader?.securityClearances, label.policyId);
		if (!policy || !clearance || !canAccess(policy, label, clearance)) {
			return toWithheldMessage(message);
		}
		return { ...message, securityMarking: displayMarking(policy, label, { lang: reader?.language }) };
	});
};

/**
 * Turns on enforcement of message security labels, and returns how to turn it off again.
 */
export const registerDcsHooks = (): (() => void) => {
	const unregister = [
		applyMessageSecurityLabel.patch((next, message, room, user) =>
			isEnabled() ? settleLabel(message, room, user) : next(message, room, user),
		),
		redactMessagesForUser.patch((next, messages, uid) => (isEnabled() ? redact(messages, uid) : next(messages, uid))),
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
