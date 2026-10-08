import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { renderHook } from '@testing-library/react';

import { useTeamSubscriptions, useTeamsList, useTeamsUnreadInfo } from './useTeamsList';
import { createFakeSubscription } from '../../../../tests/mocks/data';

const noUnread = {
	open: true,
	alert: false,
	unread: 0,
	userMentions: 0,
	groupMentions: 0,
	tunread: undefined,
	tunreadUser: undefined,
};

const subscription = (overrides: Partial<SubscriptionWithRoom>) =>
	createFakeSubscription({ ...noUnread, t: 'c', teamId: undefined, teamMain: undefined, ...overrides });

const engineering = subscription({ rid: 'eng-main', name: 'engineering', fname: 'Engineering', teamId: 'eng', teamMain: true });
const backend = subscription({ rid: 'eng-backend', name: 'backend', fname: 'Backend', teamId: 'eng' });
const frontend = subscription({ rid: 'eng-frontend', name: 'frontend', fname: 'Frontend', teamId: 'eng', t: 'p' });
const operations = subscription({ rid: 'ops-main', name: 'operations', fname: 'Operations', teamId: 'ops', teamMain: true });
const incidents = subscription({ rid: 'ops-incidents', name: 'incidents', fname: 'Incidents', teamId: 'ops' });
const general = subscription({ rid: 'general', name: 'general', fname: 'general' });
// The user is in a room of this team but not in the team itself, so there is no main room to name the team by.
const orphan = subscription({ rid: 'orphan', name: 'orphan', fname: 'Orphan', teamId: 'other' });

const wrapper = (subscriptions: SubscriptionWithRoom[], sortBy: 'activity' | 'alphabetical' = 'alphabetical') =>
	mockAppRoot().withSubscriptions(subscriptions).withUserPreference('sidebarSortby', sortBy).build();

const all = [operations, backend, general, engineering, incidents, frontend, orphan];

describe('useTeamSubscriptions', () => {
	it('groups joined rooms under their team, leaving out rooms outside teams and teams without a main room', () => {
		const { result } = renderHook(() => useTeamSubscriptions(), { wrapper: wrapper(all) });

		expect(
			result.current.map(({ key, title, main, rooms }) => ({ key, title, main: main.rid, rooms: rooms.map(({ rid }) => rid) })),
		).toEqual([
			{ key: 'eng', title: 'Engineering', main: 'eng-main', rooms: ['eng-backend', 'eng-frontend'] },
			{ key: 'ops', title: 'Operations', main: 'ops-main', rooms: ['ops-incidents'] },
		]);
	});

	it('keeps the subscription order when sorting by activity', () => {
		const { result } = renderHook(() => useTeamSubscriptions(), { wrapper: wrapper(all, 'activity') });

		expect(result.current.map(({ key }) => key)).toEqual(['ops', 'eng']);
	});
});

describe('useTeamsList', () => {
	const render = (props: { expandedTeams: string[]; filterText?: string }) =>
		renderHook(
			() => {
				const teams = useTeamSubscriptions();
				return useTeamsList({ teams, ...props });
			},
			{ wrapper: wrapper(all) },
		);

	it('lists the main room first and the other rooms below it for an expanded team', () => {
		const { result } = render({ expandedTeams: ['eng'] });

		const [eng, ops] = result.current;
		expect(eng.expanded).toBe(true);
		expect(eng.rooms.map(({ rid }) => rid)).toEqual(['eng-main', 'eng-backend', 'eng-frontend']);
		expect(ops.expanded).toBe(false);
		expect(ops.rooms).toEqual([]);
	});

	it('filters by team name, keeping all the rooms of a matching team', () => {
		const { result } = render({ expandedTeams: [], filterText: 'OPER' });

		expect(result.current).toHaveLength(1);
		expect(result.current[0].expanded).toBe(true);
		expect(result.current[0].rooms.map(({ rid }) => rid)).toEqual(['ops-main', 'ops-incidents']);
	});

	it('filters by room name, keeping only the matching rooms', () => {
		const { result } = render({ expandedTeams: [], filterText: 'front' });

		expect(result.current).toHaveLength(1);
		expect(result.current[0].key).toBe('eng');
		expect(result.current[0].rooms.map(({ rid }) => rid)).toEqual(['eng-frontend']);
	});

	it('returns no team when nothing matches the filter', () => {
		const { result } = render({ expandedTeams: [], filterText: 'nothing like this' });

		expect(result.current).toEqual([]);
	});
});

describe('unread state', () => {
	const withUnread = [
		{ ...operations },
		{ ...incidents, unread: 3, alert: true, userMentions: 1 },
		{ ...engineering, unread: 2, alert: true },
		{ ...backend },
		{ ...general, unread: 10, alert: true },
	];

	it('shows what a collapsed team hides on its header, and nothing on an expanded one', () => {
		const { result } = renderHook(
			() => {
				const teams = useTeamSubscriptions();
				return useTeamsList({ teams, expandedTeams: ['eng'] });
			},
			{ wrapper: wrapper(withUnread) },
		);

		const eng = result.current.find(({ key }) => key === 'eng');
		const ops = result.current.find(({ key }) => key === 'ops');

		expect(eng?.unreadInfo).toMatchObject({ unread: 0, userMentions: 0 });
		expect(ops?.unreadInfo).toMatchObject({ unread: 3, userMentions: 1 });
	});

	it('adds up every team room for the rail item, leaving out rooms outside teams', () => {
		const { result } = renderHook(() => useTeamsUnreadInfo(), { wrapper: wrapper(withUnread) });

		expect(result.current).toMatchObject({ unread: 5, userMentions: 1 });
	});
});
