import { onLicense } from '../../license/server';
import { MentionsParser } from '../../../../app/mentions/lib/MentionsParser';
import { settings } from '../../../../app/settings/server';
import { promises } from '../../../../app/promises/server';
import { callbacks } from '../../../../app/callbacks/server';
import { IMessage } from '../../../../definition/IMessage';
import { Team } from '../../../../server/sdk';

onLicense('teams-mention', () => {
	console.log('add teams mention service');
	const mentionsParser = new MentionsParser({
		pattern: settings.get('UTF8_Names_Validation'),
		useRealName: settings.get('UI_Use_Real_Name'),
		me: undefined,
	});

	async function addMembersFromMentionedTeam(message: IMessage): Promise<IMessage> {
		console.log('adding member');
		const result = callbacks.run('beforeSaveMessage', message);
		console.log('message: ', message);
		const mentions: string[] = mentionsParser.getUserMentions(message.msg);

		const normalizedMentions = mentions.map((m) => m.slice(1));
		console.log('mentions: ', normalizedMentions);

		const team = await Team.getOneByNames(normalizedMentions);

		if (!team) {
			console.log('team not found');
			return result;
		}

		console.log('team: ', team);

		const members = await Team.members(team._id, team.name);

		if (!members || members.total === 0) {
			console.log('members not found');
			return result;
		}

		console.log('members: ', members);

		if (!result.mentions) {
			result.mentions = [];
		}

		members.records.map((m) => result.mentions?.push({ _id: m.user._id, name: m.user.name }));

		console.log('result: ', result);
		return result;
	}

	promises.add('beforeSaveMessage', addMembersFromMentionedTeam, promises.priority.HIGH, 'team-mentions');
});
