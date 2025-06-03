import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import VoipOngoingView from './VoipOngoingView';
import { createMockFreeSwitchExtensionDetails, createMockVoipOngoingSession } from '../../../tests/mocks';

const wrapper = mockAppRoot().withEndpoint('GET', '/v1/voip-freeswitch.extension.getDetails', () => createMockFreeSwitchExtensionDetails());

const ongoingSession = createMockVoipOngoingSession();

const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

beforeEach(() => {
	jest.useFakeTimers();
});

afterEach(() => {
	jest.clearAllTimers();
});

it('should properly render ongoing view', async () => {
	render(<VoipOngoingView session={ongoingSession} />, { wrapper: wrapper.build() });

	expect(screen.getByText('00:00')).toBeInTheDocument();
	expect(screen.getByRole('button', { name: /Device_settings/ })).toBeInTheDocument();
	expect(await screen.findByText('Administrator')).toBeInTheDocument();
	expect(screen.queryByText('On_Hold')).not.toBeInTheDocument();
	expect(screen.queryByText('Muted')).not.toBeInTheDocument();
});

it('should display on hold and muted', () => {
	ongoingSession.isMuted = true;
	ongoingSession.isHeld = true;

	render(<VoipOngoingView session={ongoingSession} />, { wrapper: wrapper.build() });

	expect(screen.getByText('On_Hold')).toBeInTheDocument();
	expect(screen.getByText('Muted')).toBeInTheDocument();

	ongoingSession.isMuted = false;
	ongoingSession.isHeld = false;
});

it('should only enable ongoing call actions', () => {
	render(<VoipOngoingView session={ongoingSession} />, { wrapper: wrapper.build() });

	expect(within(screen.getByTestId('vc-popup-footer')).queryAllByRole('button')).toHaveLength(5);
	expect(screen.getByRole('button', { name: 'Turn_off_microphone' })).toBeEnabled();
	expect(screen.getByRole('button', { name: 'Hold' })).toBeEnabled();
	expect(screen.getByRole('button', { name: 'Open_Dialpad' })).toBeEnabled();
	expect(screen.getByRole('button', { name: 'Transfer_call' })).toBeEnabled();
	expect(screen.getByRole('button', { name: 'End_call' })).toBeEnabled();
});

it('should properly interact with the voice call session', async () => {
	render(<VoipOngoingView session={ongoingSession} />, { wrapper: wrapper.build() });

	await user.click(screen.getByRole('button', { name: 'Turn_off_microphone' }));
	expect(ongoingSession.mute).toHaveBeenCalled();

	await user.click(screen.getByRole('button', { name: 'Hold' }));
	expect(ongoingSession.hold).toHaveBeenCalled();

	await user.click(screen.getByRole('button', { name: 'Open_Dialpad' }));
	await user.click(screen.getByTestId('dial-pad-button-1'));
	expect(screen.getByRole('textbox', { name: 'Phone_number' })).toHaveValue('1');
	expect(ongoingSession.dtmf).toHaveBeenCalledWith('1');

	expect(screen.getByRole('button', { name: 'End_call' })).toBeEnabled();
	await user.click(screen.getByRole('button', { name: 'End_call' }));
	expect(ongoingSession.end).toHaveBeenCalled();
});
