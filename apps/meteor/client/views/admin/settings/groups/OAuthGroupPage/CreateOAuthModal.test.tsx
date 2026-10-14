import { it } from 'node:test';

import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'expect';
import { fn } from 'jest-mock';
import type { FunctionLike } from 'jest-mock';

import CreateOAuthModal from './CreateOAuthModal';

it('should call onClose when Cancel is clicked', async () => {
	const onConfirm = fn<FunctionLike>();
	const onClose = fn<FunctionLike>();

	render(<CreateOAuthModal onConfirm={onConfirm} onClose={onClose} />, {
		wrapper: mockAppRoot().build(),
	});

	await userEvent.click(screen.getByText('Cancel'));

	expect(onClose).toHaveBeenCalled();
});

it('should call onClose when X is clicked', async () => {
	const onConfirm = fn<FunctionLike>();
	const onClose = fn<FunctionLike>();

	render(<CreateOAuthModal onConfirm={onConfirm} onClose={onClose} />, {
		wrapper: mockAppRoot().build(),
	});

	await userEvent.click(screen.getByLabelText('Close'));

	expect(onClose).toHaveBeenCalled();
});

it('should call onConfirm when Add button is clicked', async () => {
	const onConfirm = fn<FunctionLike>();
	const onClose = fn<FunctionLike>();

	render(<CreateOAuthModal onConfirm={onConfirm} onClose={onClose} />, {
		wrapper: mockAppRoot().build(),
	});

	const custoOAuthNameInput = screen.getByLabelText('Custom_OAuth_name');
	await userEvent.type(custoOAuthNameInput, 'Test');

	await userEvent.click(screen.getByText('Add'));

	await waitFor(() => expect(onConfirm).toHaveBeenCalled());
});
