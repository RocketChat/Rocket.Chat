import { Mentions } from '../../../models/server/raw';
import type { MentionKind } from '../../../../definition/IMention';
import type { ISubscription } from '../../../../definition/ISubscription';
import type { IMessage } from '../../../../definition/IMessage';

type storeMentionRecordOptions = {
	hasMentionToHere: boolean;
	hasMentionToAll: boolean;
	hasMentionToUser: boolean;
	isHighlighted: boolean;
};

export const storeMentionRecord = (
	subscription: ISubscription,
	message: IMessage,
	{ hasMentionToHere, hasMentionToAll, hasMentionToUser, isHighlighted }: storeMentionRecordOptions,
): void => {
	const kind = ((): MentionKind | undefined => {
		if (hasMentionToUser) {
			return 'user';
		}
		if (hasMentionToHere) {
			return 'here';
		}
		if (hasMentionToAll) {
			return 'all';
		}
		if (isHighlighted) {
			return 'highlight';
		}
	})();

	if (!kind) {
		return;
	}

	Mentions.insertOne({
		uid: subscription.u._id,
		messageId: message._id,
		rid: subscription.rid,
		kind,
		ts: new Date(),
	});
};
