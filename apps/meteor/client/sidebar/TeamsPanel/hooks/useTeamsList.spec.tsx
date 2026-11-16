import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { renderHook } from '@testing-library/react';

import { useTeamSubscriptions, useTeamsList } from './useTeamsList';
import { createFakeSubscription } from '../../../../tests/mocks/data';

const subscription = (overrides: Partial<SubscriptionWithRoom>) =>
	createFakeSubscription({
		open: true,
		alert: false,
		unread: 0,
		userMentions: 0,
		groupMentions: 0,
		tunread: undefined,
		tunreadUser: undefined,
		t: 'c',
		teamId: undefined,
		teamMain: undefined,
		...overrides,
	});

const engineering = subscription({ rid: 'eng-main', name: 'engineering', fname: 'Engineering', teamId: 'eng', teamMain: true });
const backend = subscription({ rid: 'eng-backend', name: 'backend', fname: 'Backend', teamId: 'eng' });
const operations = subscription({ rid: 'ops-main', name: 'operations', fname: 'Operations', teamId: 'ops', teamMain: true });
const incidents = subscription({ rid: 'ops-incidents', name: 'incidents', fname: 'Incidents', teamId: 'ops', unread: 3, userMentions: 1 });
const general = subscription({ rid: 'general', name: 'general', fname: 'general' });
const roomOfTeamNotJoined = subscription({ rid: 'orphan', name: 'orphan', fname: 'Orphan', teamId: 'other' });

const renderTeamsList = (expandedTeams: string[], filterText?: string) =>
	renderHook(() => useTeamsList({ teams: useTeamSubscriptions(), expandedTeams, filterText }), {
		wrapper: mockAppRoot()
			.withSubscriptions([operations, backend, general, engineering, incidents, roomOfTeamNotJoined])
			.withUserPreference('sidebarSortby', 'activity')
			.build(),
	});

describe('useTeamsList', () => {
	it('should list the joined teams alphabetically, leaving out rooms outside teams and teams the user is not in', () => {
		const { result } = renderTeamsList([]);

		expect(result.current.map(({ key, title }) => ({ key, title }))).toEqual([
			{ key: 'eng', title: 'Engineering' },
			{ key: 'ops', title: 'Operations' },
		]);
	});

	it('should list the main room first in an expanded team, and count the unread of the rooms a collapsed team hides', () => {
		const { result } = renderTeamsList(['eng']);
		const [eng, ops] = result.current;

		expect(eng.rooms.map(({ rid }) => rid)).toEqual(['eng-main', 'eng-backend']);
		expect(eng.unreadInfo).toMatchObject({ unread: 0, userMentions: 0 });
		expect(ops.rooms).toEqual([]);
		expect(ops.unreadInfo).toMatchObject({ unread: 3, userMentions: 1 });
	});

	it('should keep every room of a team that matches the filter by name, and only the matching rooms of the other teams', () => {
		const { result } = renderTeamsList([], 'EN');

		expect(result.current.map(({ key, expanded, rooms }) => ({ key, expanded, rooms: rooms.map(({ rid }) => rid) }))).toEqual([
			{ key: 'eng', expanded: true, rooms: ['eng-main', 'eng-backend'] },
			{ key: 'ops', expanded: true, rooms: ['ops-incidents'] },
		]);
	});
});
