import { Team } from '@rocket.chat/core-services';
import type { MessageMention } from '@rocket.chat/core-typings';

import { settings } from '../../settings/server';

let TROUBLESHOOT_DISABLE_TEAMS_MENTION = settings.get('Troubleshoot_Disable_Teams_Mention');

settings.watch<boolean>('Troubleshoot_Disable_Teams_Mention', (value) => {
	TROUBLESHOOT_DISABLE_TEAMS_MENTION = value;
});

export async function beforeGetMentions(mentionIds: string[], teamMentions: MessageMention[]): Promise<string[]> {
	if (!teamMentions.length) return mentionIds;

	const teamsIds = teamMentions.map(({ _id }) => _id);
	const members = await Team.getMembersByTeamIds(teamsIds, { projection: { userId: 1 } });
	return [...new Set([...mentionIds, ...members.map(({ userId }) => userId)])];
};
