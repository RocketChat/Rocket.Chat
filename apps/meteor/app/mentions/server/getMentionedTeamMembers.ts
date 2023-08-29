import { Team } from '@rocket.chat/core-services';
import type { ITeamMember, IMessage } from '@rocket.chat/core-typings';

import { callbacks } from '../../../lib/callbacks';

interface IExtraDataForNotification {
	userMentions: any[];
	otherMentions: any[];
	message: IMessage;
}

callbacks.add('beforeGetMentions', async (mentionIds: string[], extra?: IExtraDataForNotification) => {
	const { otherMentions } = extra ?? {};

	const teamIds = otherMentions?.filter(({ type }) => type === 'team').map(({ _id }) => _id);

	if (!teamIds?.length) {
		return mentionIds;
	}

	const members = await Team.getMembersByTeamIds(teamIds, { projection: { userId: 1 } });
	mentionIds.push(...new Set(members.map(({ userId }) => userId).filter((userId) => !mentionIds.includes(userId))));

	return mentionIds;
});
