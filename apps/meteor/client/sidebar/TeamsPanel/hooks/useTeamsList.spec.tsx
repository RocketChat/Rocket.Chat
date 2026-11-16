import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { act, renderHook } from '@testing-library/react';

import { useTeamSubscriptions, useTeamsList } from './useTeamsList';
import { createFakeSubscription } from '../../../../tests/mocks/data';
import type { TeamUnreadOptions } from '../teamsPanelStore';
import { teamsPanelStore } from '../teamsPanelStore';

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

const renderTeamsList = (expandedTeams: string[], filterText?: string, teamsUnreads?: Record<string, TeamUnreadOptions>) =>
	renderHook(() => useTeamsList({ teams: useTeamSubscriptions(), expandedTeams, filterText, teamsUnreads }), {
		wrapper: mockAppRoot()
			.withSubscriptions([operations, backend, general, engineering, incidents, roomOfTeamNotJoined])
			.withUserPreference('sidebarSortby', 'activity')
			.build(),
	});

describe('useTeamsList', () => {
	afterEach(() => teamsPanelStore.setState({ teamsOrder: [] }));

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

	it('should follow the order the user moved the teams to, and ignore a move past either end', () => {
		const { result } = renderTeamsList([]);

		act(() => teamsPanelStore.getState().moveTeam(['eng', 'ops'], 'ops', 'up'));
		act(() => teamsPanelStore.getState().moveTeam(['ops', 'eng'], 'ops', 'up'));

		expect(result.current.map(({ key }) => key)).toEqual(['ops', 'eng']);
	});

	it('should keep the unread rooms of a collapsed team in view with "Always display", and put them first with "Keep on top"', () => {
		const { result: collapsed } = renderTeamsList([], undefined, { ops: { showUnreads: true } });
		const { result: expanded } = renderTeamsList(['ops'], undefined, { ops: { keepUnreadsOnTop: true } });

		expect(collapsed.current[1].rooms.map(({ rid }) => rid)).toEqual(['ops-incidents']);
		expect(collapsed.current[1].unreadInfo).toMatchObject({ unread: 0, userMentions: 0 });
		expect(expanded.current[1].rooms.map(({ rid }) => rid)).toEqual(['ops-incidents', 'ops-main']);
	});
});
