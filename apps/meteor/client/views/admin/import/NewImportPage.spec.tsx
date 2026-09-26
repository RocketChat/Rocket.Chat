import { mockAppRoot } from '@rocket.chat/mock-providers';
import { QueryClient } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import NewImportPage from './NewImportPage';

const importersMock = [
	{ key: 'slack-users', name: 'Slack_Users' },
	{ key: 'csv', name: 'CSV' },
	{ key: 'slack', name: 'Slack' },
	{ key: 'omnichannel_contact', name: 'omnichannel_contacts_importer' },
];

const setup = ({ importerKey }: { importerKey: string }) => {
	const dispatchToastMessage = jest.fn();
	const navigate = jest.fn();
	const uploadImportFile = jest.fn(() => Promise.resolve());

	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	});

	const builder = mockAppRoot()
		.withQueryClient(queryClient)
		.withEndpoint('GET', '/v1/importers.list', () => importersMock)
		.withEndpoint('POST', '/v1/uploadImportFile', uploadImportFile)
		.withRouteParameter('importerKey', importerKey)
		.withRouter({ navigate })
		.withToastMessageDispatch(dispatchToastMessage);

	render(<NewImportPage />, { wrapper: builder.build() });

	return { dispatchToastMessage, navigate, uploadImportFile };
};

const getFileInput = async () => screen.findByLabelText('Importer_Source_File');

describe('NewImportPage - File Validation', () => {
	describe('when importerKey is slack-users', () => {
		it('should reject a .pdf file and show an error toast without calling uploadImportFile', async () => {
			const { dispatchToastMessage, uploadImportFile } = setup({ importerKey: 'slack-users' });

			const input = await getFileInput();
			const invalidFile = new File(['%PDF-1.4'], 'test.pdf', { type: 'application/pdf' });

			const user = userEvent.setup({ applyAccept: false });
			await user.upload(input, invalidFile);

			expect(dispatchToastMessage).toHaveBeenCalledWith({
				type: 'error',
				message: 'Invalid_Import_File_Type',
			});
			expect(screen.queryByText('test.pdf')).not.toBeInTheDocument();

			const importButton = screen.getByRole('button', { name: 'Import' });
			expect(importButton).toBeDisabled();

			await user.click(importButton);
			expect(uploadImportFile).not.toHaveBeenCalled();
		});

		it('should accept a valid .csv file and call uploadImportFile when clicking Import', async () => {
			const { dispatchToastMessage, uploadImportFile, navigate } = setup({ importerKey: 'slack-users' });

			const input = await getFileInput();
			const validFile = new File(['username,email\njohn,john@example.com'], 'users.csv', { type: 'text/csv' });

			const user = userEvent.setup();
			await user.upload(input, validFile);

			expect(dispatchToastMessage).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }));
			expect(await screen.findByText('users.csv')).toBeInTheDocument();

			const importButton = screen.getByRole('button', { name: 'Import' });
			expect(importButton).toBeEnabled();

			await user.click(importButton);

			await waitFor(() => {
				expect(uploadImportFile).toHaveBeenCalledWith(
					expect.objectContaining({
						fileName: 'users.csv',
						importerKey: 'slack-users',
					}),
				);
			});
			expect(navigate).toHaveBeenCalledWith('/admin/import/prepare');
		});
	});

	describe('when importerKey is csv or slack', () => {
		it('should reject a .pdf file for csv importer', async () => {
			const { dispatchToastMessage, uploadImportFile } = setup({ importerKey: 'csv' });

			const input = await getFileInput();
			const invalidFile = new File(['dummy'], 'invalid.pdf', { type: 'application/pdf' });

			const user = userEvent.setup({ applyAccept: false });
			await user.upload(input, invalidFile);

			expect(dispatchToastMessage).toHaveBeenCalledWith({
				type: 'error',
				message: 'Invalid_Import_File_Type',
			});
			expect(screen.queryByText('invalid.pdf')).not.toBeInTheDocument();
			expect(uploadImportFile).not.toHaveBeenCalled();
		});

		it('should accept a .zip file for csv importer and call uploadImportFile', async () => {
			const { dispatchToastMessage, uploadImportFile, navigate } = setup({ importerKey: 'csv' });

			const input = await getFileInput();
			const validFile = new File(['PK\x03\x04'], 'export.zip', { type: 'application/zip' });

			const user = userEvent.setup();
			await user.upload(input, validFile);

			expect(dispatchToastMessage).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }));
			expect(await screen.findByText('export.zip')).toBeInTheDocument();

			const importButton = screen.getByRole('button', { name: 'Import' });
			expect(importButton).toBeEnabled();

			await user.click(importButton);

			await waitFor(() => {
				expect(uploadImportFile).toHaveBeenCalledWith(
					expect.objectContaining({
						fileName: 'export.zip',
						importerKey: 'csv',
					}),
				);
			});
			expect(navigate).toHaveBeenCalledWith('/admin/import/prepare');
		});

		it('should reject a .pdf file for slack importer', async () => {
			const { dispatchToastMessage, uploadImportFile } = setup({ importerKey: 'slack' });

			const input = await getFileInput();
			const invalidFile = new File(['dummy'], 'invalid.pdf', { type: 'application/pdf' });

			const user = userEvent.setup({ applyAccept: false });
			await user.upload(input, invalidFile);

			expect(dispatchToastMessage).toHaveBeenCalledWith({
				type: 'error',
				message: 'Invalid_Import_File_Type',
			});
			expect(screen.queryByText('invalid.pdf')).not.toBeInTheDocument();
			expect(uploadImportFile).not.toHaveBeenCalled();
		});

		it('should accept a .zip file for slack importer and call uploadImportFile', async () => {
			const { dispatchToastMessage, uploadImportFile, navigate } = setup({ importerKey: 'slack' });

			const input = await getFileInput();
			const validFile = new File(['PK\x03\x04'], 'slack_export.zip', { type: 'application/zip' });

			const user = userEvent.setup();
			await user.upload(input, validFile);

			expect(dispatchToastMessage).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }));
			expect(await screen.findByText('slack_export.zip')).toBeInTheDocument();

			const importButton = screen.getByRole('button', { name: 'Import' });
			expect(importButton).toBeEnabled();

			await user.click(importButton);

			await waitFor(() => {
				expect(uploadImportFile).toHaveBeenCalledWith(
					expect.objectContaining({
						fileName: 'slack_export.zip',
						importerKey: 'slack',
					}),
				);
			});
			expect(navigate).toHaveBeenCalledWith('/admin/import/prepare');
		});
	});
});
