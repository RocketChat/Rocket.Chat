import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import VoipIncomingView from './VoipIncomingView';
import { createMockFreeSwitchExtensionDetails, createMockVoipIncomingSession } from '../../../tests/mocks';

const appRoot = mockAppRoot().withEndpoint('GET', '/v1/voip-freeswitch.extension.getDetails', () => createMockFreeSwitchExtensionDetails());

const incomingSession = createMockVoipIncomingSession();

it('should properly render incoming view', async () => {
	render(<VoipIncomingView session={incomingSession} />, { wrapper: appRoot.build() });

	expect(screen.getByText('Incoming_call...')).toBeInTheDocument();
	expect(screen.getByRole('button', { name: /Device_settings/ })).toBeInTheDocument();
	expect(await screen.findByText('Administrator')).toBeInTheDocument();
});

it('should only enable incoming actions', () => {
	render(<VoipIncomingView session={incomingSession} />, { wrapper: appRoot.build() });

	expect(within(screen.getByTestId('vc-popup-footer')).queryAllByRole('button')).toHaveLength(5);
	expect(screen.getByRole('button', { name: 'Decline' })).toBeEnabled();
	expect(screen.getByRole('button', { name: 'Turn_off_microphone' })).toBeDisabled();
	expect(screen.getByRole('button', { name: 'Open_Dialpad' })).toBeDisabled();
	expect(screen.getByRole('button', { name: 'Transfer_call' })).toBeDisabled();
	expect(screen.getByRole('button', { name: 'Accept' })).toBeEnabled();
});

it('should properly interact with the voice call session', async () => {
	render(<VoipIncomingView session={incomingSession} />, { wrapper: appRoot.build() });

	await userEvent.click(screen.getByRole('button', { name: 'Decline' }));
	await userEvent.click(screen.getByRole('button', { name: 'Accept' }));

	expect(incomingSession.end).toHaveBeenCalled();
	expect(incomingSession.accept).toHaveBeenCalled();
});
