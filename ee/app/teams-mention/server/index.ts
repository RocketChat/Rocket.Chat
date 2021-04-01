import { _ } from 'meteor/underscore';
import { Promise } from 'meteor/promise';

import { onLicense } from '../../license/server';
import { overwriteClassOnLicense } from '../../license/server/license';
import { SpotlightEnterprise } from './EESpotlight';
import { Spotlight } from '../../../../server/lib/spotlight';
import { MentionQueries } from '../../../../app/mentions/server/server';
import { callbacks } from '../../../../app/callbacks/server';
import { MentionQueriesEnterprise } from './EEMentionQueries';
import { Team } from '../../../../server/sdk';

onLicense('teams-mention', () => {
	// Override spotlight with EE version
	overwriteClassOnLicense('teams-mention', Spotlight, SpotlightEnterprise);

	overwriteClassOnLicense('teams-mention', MentionQueries, MentionQueriesEnterprise);
	callbacks.add('notifyCustomMentions', ({ /* message, */ otherMentions, /* room, */ mentionIdsWithoutGroups, mentionIds }: { otherMentions: any[]; mentionIdsWithoutGroups: Array<string>; mentionIds: Array<string>}) => {
		const teamIds = otherMentions.filter(({ mentionType }) => mentionType === 'team').map(({ _id }) => _id);

		if (!teamIds || !teamIds.length) {
			return;
		}

		const members = Promise.await(Team.getMembersByTeamIds(teamIds, { projection: { userId: 1 } }));
		const userIds: Array<string> = _.unique(members.map(({ userId }: { userId: string }) => userId).filter((userId: string) => !mentionIdsWithoutGroups.includes(userId)));

		mentionIdsWithoutGroups.push(...userIds);
		mentionIds.push(...userIds);
	});
});
