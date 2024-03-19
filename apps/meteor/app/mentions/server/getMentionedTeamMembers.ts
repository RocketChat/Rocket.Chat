import { Team } from '@rocket.chat/core-services';
import type { MessageMention } from '@rocket.chat/core-typings';

export async function beforeGetMentions(mentionIds: string[], teamMentions: MessageMention[]): Promise<string[]> {
	if (!teamMentions.length) return mentionIds;

	const teamsIds = teamMentions.map(({ _id }) => _id);
	const members = await Team.getMembersByTeamIds(teamsIds, { projection: { userId: 1 } });
	return [...new Set([...mentionIds, ...members.map(({ userId }) => userId)])];
}
