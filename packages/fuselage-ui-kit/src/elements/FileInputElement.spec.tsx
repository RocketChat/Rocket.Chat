import { MockedServerContext } from '@rocket.chat/mock-providers';
import type * as UiKit from '@rocket.chat/ui-kit';
import { BlockContext } from '@rocket.chat/ui-kit';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';

import FileInputElement from './FileInputElement';
import { UiKitContext } from '../contexts/UiKitContext';
import { modalParser } from '../surfaces';

const block = (overrides: Partial<UiKit.FileInputElement> = {}): UiKit.FileInputElement => ({
	type: 'file_input',
	appId: 'app',
	blockId: 'block',
	actionId: 'files',
	...overrides,
});

const renderFileInput = (element: UiKit.FileInputElement, context: Partial<ComponentProps<typeof UiKitContext.Provider>['value']> = {}) => {
	const updateState = jest.fn();
	const setUploading = jest.fn();
	const uploadFile = jest.fn(async (file: File) => ({ _id: `id-${file.name}`, name: file.name }));

	render(
		<MockedServerContext>
			<UiKitContext.Provider value={{ action: jest.fn(), updateState, setUploading, uploadFile, values: {}, ...context }}>
				<FileInputElement index={0} block={element} context={BlockContext.FORM} surfaceRenderer={modalParser} />
			</UiKitContext.Provider>
		</MockedServerContext>,
	);

	return { updateState, setUploading, uploadFile, input: screen.getByLabelText('UIKit_File_input_choose') };
};

const file = (name: string) => new File(['content'], name);

it('uploads a picked file and keeps its id as the value', async () => {
	const { input, uploadFile, updateState } = renderFileInput(block());

	await userEvent.upload(input, file('report.pdf'));

	await waitFor(() =>
		expect(updateState).toHaveBeenCalledWith(expect.objectContaining({ actionId: 'files', value: ['id-report.pdf'] }), expect.anything()),
	);
	expect(uploadFile).toHaveBeenCalledTimes(1);
	expect(screen.getByText('report.pdf')).toBeInTheDocument();
});

it('keeps the ids of every file of a multiple selection', async () => {
	const { input, updateState } = renderFileInput(block());

	await userEvent.upload(input, [file('a.txt'), file('b.txt')]);

	await waitFor(() =>
		expect(updateState).toHaveBeenLastCalledWith(expect.objectContaining({ value: ['id-a.txt', 'id-b.txt'] }), expect.anything()),
	);
});

it('removes a file from the value', async () => {
	const { input, updateState } = renderFileInput(block());
	await userEvent.upload(input, [file('a.txt'), file('b.txt')]);
	expect(await screen.findByText('b.txt')).toBeInTheDocument();

	await userEvent.click(screen.getAllByRole('button', { name: 'UIKit_File_input_remove_file' })[0]);

	await waitFor(() => expect(updateState).toHaveBeenLastCalledWith(expect.objectContaining({ value: ['id-b.txt'] }), expect.anything()));
	expect(screen.queryByText('a.txt')).not.toBeInTheDocument();
});

it('uploads only the files whose extension is listed in filetypes', async () => {
	const { input, uploadFile } = renderFileInput(block({ filetypes: ['pdf', 'png'] }), {});

	await userEvent.upload(input, [file('doc.PDF'), file('script.exe')], { applyAccept: false });

	await waitFor(() => expect(uploadFile).toHaveBeenCalledTimes(1));
	expect(uploadFile).toHaveBeenCalledWith(expect.objectContaining({ name: 'doc.PDF' }));
	expect(screen.getByRole('alert')).toHaveTextContent('UIKit_File_input_type_not_accepted');
});

it('uploads no more than max_files', async () => {
	const { input, uploadFile } = renderFileInput(block({ max_files: 2 }));

	await userEvent.upload(input, [file('a.txt'), file('b.txt'), file('c.txt')]);

	await waitFor(() => expect(uploadFile).toHaveBeenCalledTimes(2));
	expect(screen.getByRole('alert')).toHaveTextContent('UIKit_File_input_max_files');
});

it('reports the uploads in flight so the surface can hold the submit', async () => {
	let finish: (uploaded: { _id: string; name: string }) => void = () => undefined;
	const uploadFile = jest.fn(
		() =>
			new Promise<{ _id: string; name: string }>((resolve) => {
				finish = resolve;
			}),
	);
	const { input, setUploading } = renderFileInput(block(), { uploadFile });

	await userEvent.upload(input, file('a.txt'));
	expect(setUploading).toHaveBeenLastCalledWith('files', true);

	finish({ _id: 'a', name: 'a.txt' });
	await waitFor(() => expect(setUploading).toHaveBeenLastCalledWith('files', false));
});

it('shows an error and keeps the value when an upload fails', async () => {
	const { input, updateState } = renderFileInput(block(), { uploadFile: jest.fn().mockRejectedValue(new Error('nope')) });

	await userEvent.upload(input, file('a.txt'));

	expect(await screen.findByRole('alert')).toHaveTextContent('UIKit_File_input_upload_failed');
	expect(updateState).not.toHaveBeenCalled();
});

it('is disabled when the surface cannot store files', () => {
	const { input } = renderFileInput(block(), { uploadFile: undefined });

	expect(input).toBeDisabled();
	expect(screen.getByText('UIKit_File_input_unavailable')).toBeInTheDocument();
});
