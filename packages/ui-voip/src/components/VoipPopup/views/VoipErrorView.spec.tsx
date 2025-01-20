import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import VoipErrorView from './VoipErrorView';
import { createMockFreeSwitchExtensionDetails, createMockVoipErrorSession } from '../../../tests/mocks';

const appRoot = mockAppRoot().withEndpoint('GET', '/v1/voip-freeswitch.extension.getDetails', () => createMockFreeSwitchExtensionDetails());

it('should properly render error view', async () => {
	const errorSession = createMockVoipErrorSession({ error: { status: -1, reason: '' } });
	render(<VoipErrorView session={errorSession} />, { wrapper: appRoot.build() });

	expect(screen.queryByLabelText('Device_settings')).not.toBeInTheDocument();
	expect(await screen.findByText('Administrator')).toBeInTheDocument();
});

it('should only enable error actions', () => {
	const errorSession = createMockVoipErrorSession({ error: { status: -1, reason: '' } });
	render(<VoipErrorView session={errorSession} />, { wrapper: appRoot.build() });

	expect(within(screen.getByTestId('vc-popup-footer')).queryAllByRole('button')).toHaveLength(5);
	expect(screen.getByRole('button', { name: 'Turn_off_microphone' })).toBeDisabled();
	expect(screen.getByRole('button', { name: 'Hold' })).toBeDisabled();
	expect(screen.getByRole('button', { name: 'Open_Dialpad' })).toBeDisabled();
	expect(screen.getByRole('button', { name: 'Transfer_call' })).toBeDisabled();
	expect(screen.getByRole('button', { name: 'End_call' })).toBeEnabled();
});

it('should properly interact with the voice call session', async () => {
	const errorSession = createMockVoipErrorSession({ error: { status: -1, reason: '' } });
	render(<VoipErrorView session={errorSession} />, { wrapper: appRoot.build() });

	await userEvent.click(screen.getByRole('button', { name: 'End_call' }));
	expect(errorSession.end).toHaveBeenCalled();
});

it('should properly render unknown error calls', async () => {
	const session = createMockVoipErrorSession({ error: { status: -1, reason: '' } });
	render(<VoipErrorView session={session} />, { wrapper: appRoot.build() });

	expect(screen.getByText('Unable_to_complete_call')).toBeInTheDocument();
	await userEvent.click(screen.getByRole('button', { name: 'End_call' }));
	expect(session.end).toHaveBeenCalled();
});

it('should properly render error for unavailable calls', async () => {
	const session = createMockVoipErrorSession({ error: { status: 480, reason: '' } });
	render(<VoipErrorView session={session} />, { wrapper: appRoot.build() });

	expect(screen.getByText('Temporarily_unavailable')).toBeInTheDocument();
	expect(screen.getByRole('button', { name: 'End_call' })).toBeEnabled();
	await userEvent.click(screen.getByRole('button', { name: 'End_call' }));
	expect(session.end).toHaveBeenCalled();
});

it('should properly render error for busy calls', async () => {
	const session = createMockVoipErrorSession({ error: { status: 486, reason: '' } });
	render(<VoipErrorView session={session} />, { wrapper: appRoot.build() });

	expect(screen.getByText('Caller_is_busy')).toBeInTheDocument();
	expect(screen.getByRole('button', { name: 'End_call' })).toBeEnabled();
	await userEvent.click(screen.getByRole('button', { name: 'End_call' }));
	expect(session.end).toHaveBeenCalled();
});

it('should properly render error for terminated calls', async () => {
	const session = createMockVoipErrorSession({ error: { status: 487, reason: '' } });
	render(<VoipErrorView session={session} />, { wrapper: appRoot.build() });

	expect(screen.getByText('Call_terminated')).toBeInTheDocument();
	expect(screen.getByRole('button', { name: 'End_call' })).toBeEnabled();
	await userEvent.click(screen.getByRole('button', { name: 'End_call' }));
	expect(session.end).toHaveBeenCalled();
});
