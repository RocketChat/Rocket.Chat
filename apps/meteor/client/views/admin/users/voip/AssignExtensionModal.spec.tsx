/* eslint-disable testing-library/no-await-sync-events */
import { faker } from '@faker-js/faker';
import { UserStatus } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import AssignExtensionModal from './AssignExtensionModal';

const appRoot = mockAppRoot()
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
				_id: faker.database.mongodbObjectId(),
				name: 'Jane Doe',
				username: 'jane.doe',
				nickname: '',
				status: UserStatus.OFFLINE,
				avatarETag: '',
			},
		],
		success: true,
	}));

it.todo('should load with default user');

it.todo('should load with default extension');

it('should only enable "Available extensions" field if username is informed', async () => {
	render(<AssignExtensionModal onClose={() => undefined} />, {
		wrapper: appRoot.build(),
	});

	const extensionsSelect = screen.getByRole('button', { name: /Select_an_option/i });
	expect(extensionsSelect).toHaveClass('disabled');
	expect(screen.getByLabelText('User')).toBeEnabled();

	screen.getByLabelText('User').focus();
	const userOption = await screen.findByRole('option', { name: 'Jane Doe' });
	await userEvent.click(userOption);

	await waitFor(() => expect(extensionsSelect).not.toHaveClass('disabled'));
});

it('should only enable "Associate" button both username and extension is informed', async () => {
	render(<AssignExtensionModal onClose={() => undefined} />, {
		wrapper: appRoot.build(),
	});

	expect(screen.getByRole('button', { name: /Associate/i, hidden: true })).toBeDisabled();

	screen.getByLabelText('User').focus();
	const userOption = await screen.findByRole('option', { name: 'Jane Doe' });
	await userEvent.click(userOption);

	const extensionsSelect = screen.getByRole('button', { name: /Select_an_option/i });
	await waitFor(() => expect(extensionsSelect).not.toHaveClass('disabled'));

	extensionsSelect.click();
	const extOption = await screen.findByRole('option', { name: '1000' });
	await userEvent.click(extOption);

	expect(screen.getByRole('button', { name: /Associate/i, hidden: true })).toBeEnabled();
});

it('should call onClose when extension is associated', async () => {
	const closeFn = jest.fn();
	render(<AssignExtensionModal onClose={closeFn} />, {
		wrapper: appRoot.build(),
	});

	screen.getByLabelText('User').focus();
	const userOption = await screen.findByRole('option', { name: 'Jane Doe' });
	await userEvent.click(userOption);

	const extensionsSelect = screen.getByRole('button', { name: /Select_an_option/i });
	await waitFor(() => expect(extensionsSelect).not.toHaveClass('disabled'));

	extensionsSelect.click();
	const extOption = await screen.findByRole('option', { name: '1000' });
	await userEvent.click(extOption);

	screen.getByRole('button', { name: /Associate/i, hidden: true }).click();
	await waitFor(() => expect(closeFn).toHaveBeenCalled());
});

it('should call onClose when cancel button is clicked', () => {
	const closeFn = jest.fn();
	render(<AssignExtensionModal onClose={closeFn} />, {
		wrapper: appRoot.build(),
	});

	screen.getByRole('button', { name: /Cancel/i, hidden: true }).click();
	expect(closeFn).toHaveBeenCalled();
});

it('should call onClose when cancel button is clicked', () => {
	const closeFn = jest.fn();
	render(<AssignExtensionModal onClose={closeFn} />, {
		wrapper: appRoot.build(),
	});

	screen.getByRole('button', { name: /Close/i, hidden: true }).click();
	expect(closeFn).toHaveBeenCalled();
});
