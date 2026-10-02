import type { IImport, Serialized } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import PrepareImportPage from './PrepareImportPage';
import { ProgressStep } from '../../../../app/importer/lib/ImporterProgressStep';

const operation = (status: IImport['status']) => ({ operation: { valid: true, status } as Serialized<IImport> });

const fileData = {
	name: 'csv',
	message_count: 3,
	users: [
		{
			user_id: 'u1',
			username: 'john.doe',
			email: 'john@doe.com',
			is_deleted: false,
			is_bot: false,
			do_import: true,
			is_email_taken: false,
		},
	],
	channels: [],
	contacts: [],
};

const renderPage = (status: IImport['status'], navigate = jest.fn()) => {
	render(<PrepareImportPage />, {
		wrapper: mockAppRoot()
			.withRouter({ navigate })
			.withEndpoint('GET', '/v1/getCurrentImportOperation', () => operation(status))
			.withEndpoint('GET', '/v1/getImportFileData', () => fileData)
			.build(),
	});
	return navigate;
};

it('should list the prepared users and let them be deselected', async () => {
	renderPage(ProgressStep.USER_SELECTION);

	expect(await screen.findByText('john.doe')).toBeInTheDocument();

	const startButton = screen.getByRole('button', { name: 'Importer_Prepare_Start_Import' });
	expect(startButton).toBeEnabled();

	await userEvent.click(screen.getAllByRole('checkbox')[1]);

	expect(startButton).toBeDisabled();
	expect(screen.getAllByRole('checkbox')[1]).not.toBeChecked();
});

it('should redirect to the progress page when the import already started', async () => {
	const navigate = renderPage(ProgressStep.IMPORTING_USERS);

	await waitFor(() => expect(navigate).toHaveBeenCalledWith('/admin/import/progress'));
});

it('should redirect back when the import is done', async () => {
	const navigate = renderPage(ProgressStep.DONE);

	await waitFor(() => expect(navigate).toHaveBeenCalledWith('/admin/import'));
});
