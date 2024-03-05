import { Team } from '@rocket.chat/core-services';
import type { MessageMention } from '@rocket.chat/core-typings';

import { callbacks } from '../../../lib/callbacks';
import { settings } from '../../settings/server';

const beforeGetTeamMentions = async (mentionIds: string[], teamMentions?: MessageMention[]): Promise<string[]> => {
	if (teamMentions?.length) return mentionIds;
	const teamsIds = teamMentions?.map(({ _id }) => _id);
	const members = await Team.getMembersByTeamIds(teamsIds as string[], { projection: { userId: 1 } } as { projection: { userId: 1 } });
	return [...new Set([...mentionIds, ...members.map(({ userId }: { userId: string }) => userId)])];
};

settings.watch<boolean>('Troubleshoot_Disable_Teams_Mention', (value) => {
	if (value) {
		callbacks.remove('beforeGetTeamMentions', 'beforeGetTeamMentions');
	} else {
		callbacks.add(
			'beforeGetTeamMentions',
			(mentionIds, teamMentions) => beforeGetTeamMentions(mentionIds, teamMentions),
			callbacks.priority.MEDIUM,
			'beforeGetTeamMentions',
		);
	}
});
