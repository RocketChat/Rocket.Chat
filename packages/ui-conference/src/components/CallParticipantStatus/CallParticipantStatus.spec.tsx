import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import CallParticipantStatus from './CallParticipantStatus';
import type { PluginParticipant } from '../../lib/providerPlugin';

const buildParticipant = (overrides: Partial<PluginParticipant> = {}): PluginParticipant =>
	({
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
		can: { control: true, mute: true, disconnect: true, transfer: true, spotlight: true, fecc: true, raiseHand: true, changeLayout: true },
		...overrides,
	}) as PluginParticipant;

const renderStatus = (participant: PluginParticipant) =>
	render(<CallParticipantStatus participant={participant} />, {
		wrapper: mockAppRoot()
			.withJohnDoe()
			.withTranslations('en', 'core', { Microphone_muted: 'Microphone muted', Raised_hand: 'Raised hand' })
			.build(),
	});

it('says nothing about someone the provider has nothing to say about', () => {
	renderStatus(buildParticipant());

	expect(screen.queryByText('Microphone muted')).not.toBeInTheDocument();
	expect(screen.queryByText('Raised hand')).not.toBeInTheDocument();
});

// Both mutes read the same here on purpose: silenced by the conference and self-silenced sound identical to
// everyone listening, and which it was only matters to whoever is deciding to undo it.
it('marks a microphone the conference silenced', () => {
	renderStatus(buildParticipant({ isMuted: true }));

	expect(screen.getByText('Microphone muted')).toBeInTheDocument();
});

it('marks a microphone its owner silenced', () => {
	renderStatus(buildParticipant({ isClientMuted: true }));

	expect(screen.getByText('Microphone muted')).toBeInTheDocument();
});

it('marks a raised hand, in words as well as the drawing', () => {
	renderStatus(buildParticipant({ raisedHand: true }));

	expect(screen.getByText('Raised hand')).toBeInTheDocument();
});
