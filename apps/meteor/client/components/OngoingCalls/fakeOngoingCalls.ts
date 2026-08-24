import type { JoinableVideoConference } from '@rocket.chat/core-typings';

/**
 * Scaffolding for working on the ongoing-calls layout: a few calls that are always there, so the list can be
 * looked at without arranging real ones between three browser windows.
 *
 * **Off unless asked for.** Set the flag below and reload:
 *
 * ```js
 * localStorage.rcFakeOngoingCalls = '1';
 * ```
 *
 * Delete this file and its three call sites — two in `useOngoingCalls`, one in `RingingCallItem` — once the layout
 * is settled. It exists to be thrown away, which is why it is a separate file rather than a condition inside them.
 */
export const fakeOngoingCallsEnabled = () => {
	try {
		return localStorage.getItem('rcFakeOngoingCalls') === '1';
	} catch {
		// Storage can be denied outright (private windows, embedded contexts). Scaffolding is not worth an error.
		return false;
	}
};

const person = (username: string, name: string) => ({ _id: username, username, name });

/**
 * A long name, a short one, one that is ringing, and two that were turned down — the cases the row has to survive:
 * truncation, the `joined` wording when every face is shown, the ringing treatment, and the toggle at the foot of
 * the group that the declined ones wait behind.
 *
 * `ringingAt` is in the *future* on purpose. A ring is only live for `VIDEO_CONF_RINGING_WINDOW_MS` (15s), so a
 * timestamp of "now" would settle into an ordinary row while you were still looking at it.
 */
export const fakeOngoingCalls = (): JoinableVideoConference[] => [
	{
		callId: 'fake-long',
		name: 'Meeting in "20 August planning session"',
		createdAt: new Date(Date.now() - 12 * 60_000),
		usersCount: 5,
		participants: [person('alice', 'Alice'), person('cleiton', 'Cleiton'), person('bob', 'bob')],
		joined: false,
		declined: false,
	},
	{
		callId: 'fake-short',
		name: 'Standup',
		createdAt: new Date(Date.now() - 3 * 60_000),
		usersCount: 2,
		participants: [person('john', 'john'), person('don', 'don')],
		joined: false,
		declined: false,
	},
	{
		callId: 'fake-ringing',
		name: 'Cleiton',
		createdAt: new Date(),
		usersCount: 1,
		participants: [person('cleiton', 'Cleiton')],
		joined: false,
		declined: false,
		ringingAt: new Date(Date.now() + 60 * 60_000),
	},
	{
		callId: 'fake-declined-one',
		name: 'Design review',
		createdAt: new Date(Date.now() - 25 * 60_000),
		usersCount: 4,
		participants: [person('alice', 'Alice'), person('john', 'john')],
		joined: false,
		declined: true,
	},
	{
		callId: 'fake-declined-two',
		name: 'bob',
		createdAt: new Date(Date.now() - 40 * 60_000),
		usersCount: 1,
		participants: [person('bob', 'bob')],
		joined: false,
		declined: true,
	},
];

/**
 * The ring the manager would remember if this call were real.
 *
 * `RingingCallItem` only offers to silence a call whose ring *this client actually heard*, which a fake call never
 * did — so without this the mute button is the one part of that row you cannot look at.
 */
export const fakeIncomingCalls = () => [{ callId: 'fake-ringing', dismissed: false }];
