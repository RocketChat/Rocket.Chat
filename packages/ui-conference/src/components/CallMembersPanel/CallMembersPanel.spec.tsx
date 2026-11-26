import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';

import CallMembersPanel from './CallMembersPanel';
import { ConferenceContext } from '../../context/ConferenceContext';
import type { ConferenceMember } from '../../context/definitions';
import { buildConferenceContext, JOHN_DOE_ID } from '../../fixtures/storyFixtures';
import { buildConferenceMember } from '../../fixtures/testFixtures';
import type { PluginFeature, PluginParticipant, ProviderPluginControls } from '../../lib/providerPlugin';
import { PLUGIN_FEATURES } from '../../lib/providerPlugin';

const actions = {
	mute: jest.fn(),
	muteVideo: jest.fn(),
	admit: jest.fn(),
	disconnect: jest.fn(),
	spotlight: jest.fn(),
	raiseHand: jest.fn(),
	setRole: jest.fn(),
	dialOut: jest.fn(),
	refreshRoster: jest.fn(),
	leave: jest.fn(),
};

const buildParticipant = (overrides: Partial<PluginParticipant> & Pick<PluginParticipant, 'uuid'>): PluginParticipant => ({
	displayName: overrides.uuid,
	isWaiting: false,
	isHost: false,
	isMuted: false,
	isClientMuted: false,
	isCameraMuted: false,
	isPresenting: false,
	isSpotlight: false,
	raisedHand: false,
	...overrides,
	can: {
		control: true,
		mute: true,
		disconnect: true,
		transfer: true,
		spotlight: true,
		fecc: true,
		raiseHand: true,
		changeLayout: true,
		...overrides.can,
	},
});

const buildProvider = ({
	participants = [],
	features = [...PLUGIN_FEATURES],
	self,
}: Partial<Pick<ProviderPluginControls, 'participants' | 'self'>> & { features?: PluginFeature[] } = {}): ProviderPluginControls => ({
	features: new Set(features),
	participants,
	self,
	actions,
});

const ada = buildConferenceMember({ _id: 'ada', username: 'ada', name: 'Ada Lovelace' });
const grace = buildConferenceMember({ _id: 'grace', username: 'grace', name: 'Grace Hopper', joined: false });

const appRoot = mockAppRoot().withJohnDoe().withTranslations('en', 'core', {
	Admit: 'Admit',
	Call_actions_for_participant: 'Call actions for {{name}}',
	External_participant: 'External participant',
	Host: 'Host',
	In_call: 'In call',
	Members: 'Members',
	Not_in_the_call: 'Not in the call',
	People: 'People',
	Reject: 'Reject',
	Waiting_to_join: 'Waiting to join',
	You: 'You',
});

const renderPanel = (provider?: ProviderPluginControls, members: ConferenceMember[] = [ada, grace]) => {
	const AppRoot = appRoot.build();
	const conference = buildConferenceContext({ call: { members }, provider });

	const wrapper = ({ children }: { children: ReactNode }) => (
		<AppRoot>
			<ConferenceContext.Provider value={conference}>{children}</ConferenceContext.Provider>
		</AppRoot>
	);

	return render(<CallMembersPanel onClose={jest.fn()} />, { wrapper });
};

const group = (name: string) => within(screen.getByRole('list', { name }));

beforeEach(() => jest.clearAllMocks());

describe('CallMembersPanel', () => {
	// Every provider that doesn't speak the protocol, and every call before its plugin has said anything.
	it('is our own membership, with nothing to press, when no provider is speaking', () => {
		renderPanel();

		expect(group('In call').getByText('ada')).toBeInTheDocument();
		expect(group('Not in the call').getByText('grace')).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: /Call actions/ })).not.toBeInTheDocument();
	});

	it('hands a member the controls of the participant they were resolved to', () => {
		renderPanel(
			buildProvider({
				participants: [buildParticipant({ uuid: 'p-ada', displayName: 'Ada Lovelace' })],
				self: { canControl: true } as ProviderPluginControls['self'],
			}),
		);

		expect(group('In call').getByRole('button', { name: 'Call actions for ada' })).toBeInTheDocument();
		// Nobody in the roster answers for Grace, so there is nothing a request about her could name.
		expect(group('Not in the call').queryByRole('button', { name: /Call actions/ })).not.toBeInTheDocument();
	});

	// Guests with a link, dial-ins, anyone who arrived at the provider by an address rather than an invitation.
	it('shows a participant belonging to no member as an external row in the call', () => {
		renderPanel(
			buildProvider({
				participants: [buildParticipant({ uuid: 'p-guest', displayName: 'Someone Else' })],
				self: { canControl: true } as ProviderPluginControls['self'],
			}),
		);

		const inCall = group('In call');

		expect(inCall.getByText('Someone Else')).toBeInTheDocument();
		expect(inCall.getByText('External participant')).toBeInTheDocument();
		expect(inCall.getByRole('button', { name: 'Call actions for Someone Else' })).toBeInTheDocument();
	});

	// Who runs the call is the provider's to say, per connection — a member and a room system alike.
	it('marks the members and participants the provider has as hosts, and nobody else', () => {
		renderPanel(
			buildProvider({
				participants: [
					buildParticipant({ uuid: 'p-ada', displayName: 'Ada Lovelace', isHost: true }),
					buildParticipant({ uuid: 'p-room', displayName: 'Meeting Room 3', isHost: true }),
					buildParticipant({ uuid: 'p-guest', displayName: 'Someone Else' }),
				],
			}),
		);

		const rows = group('In call').getAllByRole('listitem');
		const row = (name: string) => rows.find((item) => item.textContent?.includes(name));

		expect(row('ada')).toHaveTextContent('Host');
		expect(row('Meeting Room 3')).toHaveTextContent('Host · External participant');
		expect(row('Someone Else')).not.toHaveTextContent('Host');
	});

	it("says which row is the viewer's own, and only that one", () => {
		renderPanel(undefined, [ada, buildConferenceMember({ _id: JOHN_DOE_ID, username: 'viewer', name: 'The Viewer' })]);

		const rows = group('In call').getAllByRole('listitem');

		expect(rows.find((item) => item.textContent?.includes('viewer'))).toHaveTextContent('You');
		expect(rows.find((item) => item.textContent?.includes('ada'))).not.toHaveTextContent('You');
	});

	it('puts the viewer ahead of their being a host, on the same line', () => {
		renderPanel(buildProvider({ participants: [buildParticipant({ uuid: 'p-viewer', displayName: 'viewer', isHost: true })] }), [
			buildConferenceMember({ _id: JOHN_DOE_ID, username: 'viewer', name: 'The Viewer' }),
		]);

		expect(group('In call').getByRole('listitem')).toHaveTextContent('You · Host');
	});

	// Ahead of both other groups, because everyone in it is waiting on somebody looking at this panel. The
	// viewer has to control the conference for the door to be theirs to open — the provider says nothing about
	// controlling someone who is not in the call yet, so it cannot come from the waiting participant.
	it('puts whoever is in the lobby in a group of their own, with the two answers they need', async () => {
		renderPanel(
			buildProvider({
				participants: [buildParticipant({ uuid: 'p-ada', displayName: 'ada', isWaiting: true })],
				self: { canControl: true } as ProviderPluginControls['self'],
			}),
		);

		const lobby = group('Waiting to join');

		expect(screen.queryByRole('list', { name: 'In call' })).not.toBeInTheDocument();

		await userEvent.click(lobby.getByRole('button', { name: 'Admit' }));
		expect(actions.admit).toHaveBeenCalledWith('p-ada');

		await userEvent.click(lobby.getByRole('button', { name: 'Reject' }));
		expect(actions.disconnect).toHaveBeenCalledWith('p-ada');
	});
});
