import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import CallParticipantControls from './CallParticipantControls';
import type { PluginFeature, PluginParticipant, PluginSelf, ProviderPluginActions } from '../../lib/providerPlugin';
import { PLUGIN_FEATURES } from '../../lib/providerPlugin';

/**
 * The show-and-hide rule, seen through what a row actually offers.
 *
 * Nothing comes back over the protocol: a request the provider refuses is a 403 in a console this window cannot
 * read, and the roster simply arrives again unchanged. So a control that shouldn't be there is not a warning or
 * an error — it is a button that does nothing, silently, every single time.
 */
const actions: ProviderPluginActions = {
	mute: jest.fn(),
	muteVideo: jest.fn(),
	admit: jest.fn(),
	disconnect: jest.fn(),
	spotlight: jest.fn(),
	setRole: jest.fn(),
	raiseHand: jest.fn(),
};

const allowsEverything: PluginParticipant['can'] = {
	control: true,
	mute: true,
	disconnect: true,
	transfer: true,
	spotlight: true,
	fecc: true,
	raiseHand: true,
	changeLayout: true,
};

const buildParticipant = (overrides: Partial<PluginParticipant> = {}): PluginParticipant => ({
	uuid: 'p1',
	displayName: 'Ada Lovelace',
	isWaiting: false,
	isHost: false,
	isMuted: false,
	isClientMuted: false,
	isCameraMuted: false,
	isPresenting: false,
	isSpotlight: false,
	raisedHand: false,
	can: { ...allowsEverything },
	...overrides,
});

const appRoot = mockAppRoot().withJohnDoe().withTranslations('en', 'core', {
	Admit: 'Admit',
	Call_actions_for_participant: 'Call actions for {{name}}',
	Disconnect: 'Disconnect',
	Make_guest: 'Make guest',
	Make_host: 'Make host',
	Mute: 'Mute',
	Reject: 'Reject',
	Remove_from_spotlight: 'Remove from spotlight',
	Send_DTMF: 'Send DTMF',
	Spotlight: 'Spotlight',
	Transfer: 'Transfer',
	Leave: 'Leave',
	Cam_off: 'Cam off',
	Cam_on: 'Cam on',
	Lower_hand: 'Lower hand',
	Raise_hand: 'Raise hand',
	Unmute: 'Unmute',
});

// A viewer who controls the conference by default: it is what the lobby's controls hang on, and every case
// that is not about the lobby is indifferent to it.
const renderControls = (
	participant: PluginParticipant,
	features: PluginFeature[],
	self: PluginSelf | undefined = { canControl: true } as PluginSelf,
	isSelf = false,
) =>
	render(
		<CallParticipantControls
			name='Ada Lovelace'
			participant={participant}
			isSelf={isSelf}
			features={new Set(features)}
			actions={actions}
			self={self}
		/>,
		{ wrapper: appRoot.build() },
	);

const openMenu = async () => {
	await userEvent.click(screen.getByRole('button', { name: 'Call actions for Ada Lovelace' }));
};

beforeEach(() => jest.clearAllMocks());

describe('CallParticipantControls', () => {
	// An empty feature set is what a provider with no plugin, and a call before `ready`, both look like.
	it('offers nothing at all before the provider has announced anything', () => {
		renderControls(buildParticipant(), []);

		expect(screen.queryByRole('button')).not.toBeInTheDocument();
	});

	it('offers nothing to someone the provider lets nobody touch', () => {
		renderControls(buildParticipant({ can: { ...allowsEverything, control: false, mute: false, disconnect: false } }), [
			...PLUGIN_FEATURES,
		]);

		// `transfer` and `spotlight` are still allowed, so this is not the empty-menu case — the two withheld ones
		// are simply absent from it.
		expect(screen.getByRole('button', { name: 'Call actions for Ada Lovelace' })).toBeInTheDocument();
	});

	it('offers every control both halves allow', async () => {
		renderControls(buildParticipant(), [...PLUGIN_FEATURES]);

		await openMenu();

		expect(await screen.findByRole('menuitem', { name: 'Mute' })).toBeInTheDocument();
		expect(screen.getByRole('menuitem', { name: 'Spotlight' })).toBeInTheDocument();
		expect(screen.getByRole('menuitem', { name: 'Make host' })).toBeInTheDocument();
		expect(screen.getByRole('menuitem', { name: 'Raise hand' })).toBeInTheDocument();
		expect(screen.getByRole('menuitem', { name: 'Disconnect' })).toBeInTheDocument();

		// Announced by the provider and answered by it, but not offered here: neither is a feature this window
		// supports yet, so the protocol carries them and the menu does not.
		expect(screen.queryByRole('menuitem', { name: 'Transfer' })).not.toBeInTheDocument();
		expect(screen.queryByRole('menuitem', { name: 'Send DTMF' })).not.toBeInTheDocument();
	});

	// Your own row keeps what works on you and drops what cannot. The plugin API reaches no device: `mute` and
	// `mute-video` are the conference deciding to stop carrying you, which is not what the microphone and camera
	// buttons a few pixels away in the provider's own bar do. Two controls that look alike and behave differently
	// are worse than one.
	it('offers your own row what works on you, and calls hanging up on yourself leaving', async () => {
		renderControls(buildParticipant(), [...PLUGIN_FEATURES], { canControl: true } as PluginSelf, true);

		await openMenu();

		expect(await screen.findByRole('menuitem', { name: 'Raise hand' })).toBeInTheDocument();
		expect(screen.getByRole('menuitem', { name: 'Spotlight' })).toBeInTheDocument();
		expect(screen.getByRole('menuitem', { name: 'Leave' })).toBeInTheDocument();

		expect(screen.queryByRole('menuitem', { name: 'Mute' })).not.toBeInTheDocument();
		expect(screen.queryByRole('menuitem', { name: 'Cam off' })).not.toBeInTheDocument();
		expect(screen.queryByRole('menuitem', { name: 'Disconnect' })).not.toBeInTheDocument();
	});

	// A guest is shown who is in the call and nothing they could do about any of them: every one of these is a
	// host's, and `can.*` does not say so — it describes the subject, not the viewer's standing over them.
	it('offers a guest nothing at all against somebody else', () => {
		renderControls(buildParticipant(), [...PLUGIN_FEATURES], { canControl: false } as PluginSelf);

		expect(screen.queryByRole('button', { name: 'Call actions for Ada Lovelace' })).not.toBeInTheDocument();
	});

	// Except on their own row, where leaving and their own hand are nobody's to grant.
	it('still lets a guest leave and raise their own hand', async () => {
		renderControls(buildParticipant(), [...PLUGIN_FEATURES], { canControl: false } as PluginSelf, true);

		await openMenu();

		expect(await screen.findByRole('menuitem', { name: 'Raise hand' })).toBeInTheDocument();
		expect(screen.getByRole('menuitem', { name: 'Leave' })).toBeInTheDocument();
		expect(screen.queryByRole('menuitem', { name: 'Spotlight' })).not.toBeInTheDocument();
	});

	// The provider is the half that would have to carry the request out, and a provider that never named the
	// feature has nothing listening for it.
	it('withholds a control the provider never announced, whatever the participant allows', async () => {
		renderControls(buildParticipant(), ['mute', 'disconnect']);

		await openMenu();

		expect(await screen.findByRole('menuitem', { name: 'Mute' })).toBeInTheDocument();
		expect(screen.queryByRole('menuitem', { name: 'Spotlight' })).not.toBeInTheDocument();
		expect(screen.queryByRole('menuitem', { name: 'Transfer' })).not.toBeInTheDocument();
	});

	// And the participant's own flags are the half that says whether the provider would honour it for *them*.
	it('withholds a control the participant refuses, whatever the provider announced', async () => {
		renderControls(buildParticipant({ can: { ...allowsEverything, spotlight: false, transfer: false } }), [...PLUGIN_FEATURES]);

		await openMenu();

		expect(await screen.findByRole('menuitem', { name: 'Mute' })).toBeInTheDocument();
		expect(screen.queryByRole('menuitem', { name: 'Spotlight' })).not.toBeInTheDocument();
		expect(screen.queryByRole('menuitem', { name: 'Transfer' })).not.toBeInTheDocument();
	});

	it('asks for the opposite of what the call already says', async () => {
		renderControls(buildParticipant({ isMuted: true, isSpotlight: true, isHost: true }), [...PLUGIN_FEATURES]);

		await openMenu();

		expect(await screen.findByRole('menuitem', { name: 'Unmute' })).toBeInTheDocument();
		expect(screen.getByRole('menuitem', { name: 'Remove from spotlight' })).toBeInTheDocument();
		expect(screen.getByRole('menuitem', { name: 'Make guest' })).toBeInTheDocument();

		await userEvent.click(screen.getByRole('menuitem', { name: 'Unmute' }));

		expect(actions.mute).toHaveBeenCalledWith('p1', false);
	});

	describe('for someone waiting in the lobby', () => {
		const waiting = buildParticipant({ isWaiting: true });

		// Worth a click rather than two: letting them in is the only thing anyone wants to do here, and the rest
		// of the menu is meaningless for somebody who is not in the call yet.
		it('offers letting them in and turning them away, as buttons', async () => {
			renderControls(waiting, [...PLUGIN_FEATURES]);

			await userEvent.click(screen.getByRole('button', { name: 'Admit' }));
			expect(actions.admit).toHaveBeenCalledWith('p1');

			await userEvent.click(screen.getByRole('button', { name: 'Reject' }));
			expect(actions.disconnect).toHaveBeenCalledWith('p1');
		});

		// Admitting is the viewer's standing, not the waiting participant's: the provider reports `canControl`
		// false for anyone still in the lobby, so reading it off the subject withheld the button from every
		// person it exists for.
		it('offers letting them in even though the lobby says they control nothing', async () => {
			renderControls(buildParticipant({ isWaiting: true, can: { ...allowsEverything, control: false } }), [...PLUGIN_FEATURES]);

			await userEvent.click(screen.getByRole('button', { name: 'Admit' }));
			expect(actions.admit).toHaveBeenCalledWith('p1');
		});

		it('offers neither to a viewer who controls nothing and cannot hang up on them', () => {
			renderControls(buildParticipant({ isWaiting: true, can: { ...allowsEverything, disconnect: false } }), [...PLUGIN_FEATURES], {
				canControl: false,
			} as PluginSelf);

			expect(screen.queryByRole('button')).not.toBeInTheDocument();
		});

		it('offers nothing the lobby has no use for', () => {
			renderControls(waiting, [...PLUGIN_FEATURES]);

			expect(screen.queryByRole('button', { name: 'Call actions for Ada Lovelace' })).not.toBeInTheDocument();
		});
	});
});
