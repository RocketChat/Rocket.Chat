import { Team } from '@rocket.chat/core-services';

import { callbacks } from '../../../lib/callbacks';
import { settings } from '../../settings/server';

interface ITeamMention {
	_id: string;
	name: string;
	type: string;
}

const beforeGetTeamMentions = async (mentionIds: string[], teamMentions: ITeamMention[]): Promise<string[]> => {
	const teamsIds = teamMentions.map(({ _id }) => _id);
	const members = await Team.getMembersByTeamIds(teamsIds, { projection: { userId: 1 } });
	return [...new Set([...mentionIds, ...members.map(({ userId }) => userId)])];
};

settings.watch<boolean>('Troubleshoot_Disable_Teams_Mention', (value) => {
	if (value) {
		callbacks.remove('beforeGetTeamMentions', 'before-get-mentions-get-teams');
	} else {
		callbacks.add('beforeGetTeamMentions',
			beforeGetTeamMentions,
			callbacks.priority.MEDIUM,
			'before-get-team-mentions-get-teams');
	}
});
