import { TeamType } from '@rocket.chat/core-typings';

import { canShowParentTeam } from './useParentTeam';

describe('canShowParentTeam', () => {
	it('shows a public team to anyone', () => {
		expect(canShowParentTeam(TeamType.PUBLIC, [], 'team')).toBe(true);
	});

	it('shows a private team only to its members', () => {
		expect(canShowParentTeam(TeamType.PRIVATE, ['team'], 'team')).toBe(true);
		expect(canShowParentTeam(TeamType.PRIVATE, ['other'], 'team')).toBe(false);
	});

	it('hides a team whose type is not known yet from a non member', () => {
		expect(canShowParentTeam(undefined, [], 'team')).toBe(false);
	});
});
