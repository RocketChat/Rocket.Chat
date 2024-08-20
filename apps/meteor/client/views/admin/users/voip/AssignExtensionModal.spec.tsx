/* eslint-disable testing-library/no-await-sync-events */
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import '@testing-library/jest-dom';
import AssignExtensionModal from './AssignExtensionModal';

const root = mockAppRoot()
	.withJohnDoe()
	.withEndpoint('POST', '/v1/voip-freeswitch.extension.assign', () => null)
	.withEndpoint('GET', '/v1/voip-freeswitch.extension.list', () => ({
		extensions: [
			{
				extension: '1000',
				context: 'default',
				domain: '172.31.38.45',
				groups: ['default', 'sales'],
				status: 'UNREGISTERED' as const,
				contact: 'error/user_not_registered',
				callGroup: 'techsupport',
				callerName: 'Extension 1000',
				callerNumber: '1000',
			},
		],
		success: true,
	}))
	.withEndpoint('GET', '/v1/users.autocomplete', () => ({
		items: [
			{
				_id: 'janedoe',
				score: 2,
				name: 'Jane Doe',
				username: 'jane.doe',
				nickname: null,
				status: 'offline',
				statusText: '',
				avatarETag: null,
			} as any,
		],
		success: true,
	}));

// TODO: it('should load with default user', async () => {});

// TODO: it('should load with default extension', async () => {});

it('should only enable "Free Extension Numbers" field if username is informed', async () => {
	render(<AssignExtensionModal onClose={() => undefined} />, {
		legacyRoot: true,
		wrapper: root.build(),
	});

	expect(screen.getByTestId('input-free-extension-numbers')).toHaveClass('disabled');
	expect(screen.getByLabelText('User_Without_Extensions')).toBeEnabled();

	screen.getByLabelText('User_Without_Extensions').focus();
	const userOption = await screen.findByRole('option', { name: 'Jane Doe' });
	await userEvent.click(userOption);

	await waitFor(() => expect(screen.getByTestId('input-free-extension-numbers')).not.toHaveClass('disabled'));
});

it('should only enable "Associate" button both username and extension is informed', async () => {
	render(<AssignExtensionModal onClose={() => undefined} />, {
		legacyRoot: true,
		wrapper: root.build(),
	});

	expect(screen.getByRole('button', { name: /Associate/i, hidden: true })).toBeDisabled();

	screen.getByLabelText('User_Without_Extensions').focus();
	const userOption = await screen.findByRole('option', { name: 'Jane Doe' });
	await userEvent.click(userOption);

	await waitFor(() => expect(screen.getByTestId('input-free-extension-numbers')).not.toHaveClass('disabled'));

	screen.getByTestId('input-free-extension-numbers').click();
	const extOption = await screen.findByRole('option', { name: '1000' });
	await userEvent.click(extOption);

	expect(screen.getByRole('button', { name: /Associate/i, hidden: true })).toBeEnabled();
});

it('should call onClose when extension is associated', async () => {
	const closeFn = jest.fn();
	render(<AssignExtensionModal onClose={closeFn} />, {
		legacyRoot: true,
		wrapper: root.build(),
	});

	screen.getByLabelText('User_Without_Extensions').focus();
	const userOption = await screen.findByRole('option', { name: 'Jane Doe' });
	await userEvent.click(userOption);

	await waitFor(() => expect(screen.getByTestId('input-free-extension-numbers')).not.toHaveClass('disabled'));

	screen.getByTestId('input-free-extension-numbers').click();
	const extOption = await screen.findByRole('option', { name: '1000' });
	await userEvent.click(extOption);

	screen.getByRole('button', { name: /Associate/i, hidden: true }).click();
	await waitFor(() => expect(closeFn).toHaveBeenCalled());
});

it('should call onClose when cancel button is clicked', () => {
	const closeFn = jest.fn();
	render(<AssignExtensionModal onClose={closeFn} />, {
		legacyRoot: true,
		wrapper: root.build(),
	});

	screen.getByRole('button', { name: /Cancel/i, hidden: true }).click();
	expect(closeFn).toHaveBeenCalled();
});

it('should call onClose when cancel button is clicked', () => {
	const closeFn = jest.fn();
	render(<AssignExtensionModal onClose={closeFn} />, {
		legacyRoot: true,
		wrapper: root.build(),
	});

	screen.getByRole('button', { name: /Close/i, hidden: true }).click();
	expect(closeFn).toHaveBeenCalled();
});
