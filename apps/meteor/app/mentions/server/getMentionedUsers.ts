import { Team, dbWatchersDisabled } from '@rocket.chat/core-services';
import { Subscriptions } from '@rocket.chat/models';

export async function beforeGetMentions(userMentions: string[], teamMentions: string[], channelMentions: string[]): Promise<string[]> {
	if (!teamMentions.length && !channelMentions.length) return [...userMentions];

	const response = [];

	if (channelMentions.length && dbWatchersDisabled) {
		const channelMembers = (
			await Subscriptions.find({ rid: { $in: channelMentions } }, { projection: { 'u._id': 1, '_id': 0 } }).toArray()
		).map((user: { u: { _id: string } }) => user.u._id);
		response.push(...channelMembers);
	}

	if (teamMentions.length) {
		const teamMembers = (await Team.getMembersByTeamIds(teamMentions, { projection: { userId: 1 } })).map(({ userId }) => userId);

		response.push(...teamMembers);
	}

	return [...new Set([...userMentions, ...response])];
}
