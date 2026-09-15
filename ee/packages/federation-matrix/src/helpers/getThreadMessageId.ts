import { type EventID } from '@rocket.chat/federation-sdk';
import { logger } from '../logger';
import { Messages } from '@rocket.chat/models';

export async function getThreadMessageId(threadRootEventId: EventID): Promise<{ tmid: string; tshow: boolean } | undefined> {
	const threadRootMessage = await Messages.findOneByFederationId(threadRootEventId);
	if (!threadRootMessage) {
		logger.warn({ msg: 'Thread root message not found for event', eventId: threadRootEventId });
		return;
	}

	const shouldSetTshow = !threadRootMessage?.tcount;
	return { tmid: threadRootMessage._id, tshow: shouldSetTshow };
}
