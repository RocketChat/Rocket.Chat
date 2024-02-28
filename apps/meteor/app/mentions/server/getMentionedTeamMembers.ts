import { Team } from '@rocket.chat/core-services';
import type { IMessage } from '@rocket.chat/core-typings';

import { callbacks } from '../../../lib/callbacks';
import { settings } from '../../settings/server';

interface IExtraDataForNotification {
	userMentions: any[];
	otherMentions: any[];
	message: IMessage;
}

const beforeGetMentions = async (mentionIds: string[], extra?: IExtraDataForNotification) => {
	const { otherMentions } = extra ?? {};

	const teamIds = otherMentions?.filter(({ type }) => type === 'team').map(({ _id }) => _id);

	if (!teamIds?.length) {
		return mentionIds;
	}

	const members = await Team.getMembersByTeamIds(teamIds, { projection: { userId: 1 } });
	mentionIds.push(...new Set(members.map(({ userId }) => userId).filter((userId) => !mentionIds.includes(userId))));

	return mentionIds;
};

settings.watch<boolean>('Troubleshoot_Disable_Teams_Mention', (value) => {
	if (value) {
		callbacks.remove('beforeGetMentions', 'before-get-mentions-get-teams');
		return;
	}

	callbacks.add('beforeGetMentions', beforeGetMentions, callbacks.priority.MEDIUM, 'before-get-mentions-get-teams');
});
