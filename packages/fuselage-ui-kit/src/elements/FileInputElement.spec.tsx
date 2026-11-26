import { MockedServerContext } from '@rocket.chat/mock-providers';
import type * as UiKit from '@rocket.chat/ui-kit';
import { BlockContext } from '@rocket.chat/ui-kit';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';

import FileInputElement from './FileInputElement';
import { UiKitContext } from '../contexts/UiKitContext';
import { modalParser } from '../surfaces';
import { askConfirmation } from '../utils/askConfirmation';
import { createUiKitViewState } from '../utils/createUiKitViewState';

jest.mock('../utils/askConfirmation', () => ({ askConfirmation: jest.fn() }));

const block = (overrides: Partial<UiKit.FileInputElement> = {}): UiKit.FileInputElement => ({
	type: 'file_input',
	appId: 'app',
	blockId: 'block',
	actionId: 'files',
	...overrides,
});

const renderFileInput = (element: UiKit.FileInputElement, context: Partial<ComponentProps<typeof UiKitContext.Provider>['value']> = {}) => {
	const viewState = createUiKitViewState([]);
	const setValue = jest.spyOn(viewState, 'setValue');
	const setUploading = jest.spyOn(viewState, 'setUploading');
	const uploadFile = jest.fn(async (file: File) => ({ _id: `id-${file.name}`, name: file.name }));

	const { unmount } = render(
		<MockedServerContext>
			<UiKitContext.Provider value={{ action: jest.fn(), viewState, uploadFile, ...context }}>
				<FileInputElement index={0} block={element} context={BlockContext.FORM} surfaceRenderer={modalParser} />
			</UiKitContext.Provider>
		</MockedServerContext>,
	);

	return { unmount, setValue, setUploading, uploadFile, input: screen.getByLabelText('UIKit_File_input_choose') };
};

const file = (name: string) => new File(['content'], name);

it('uploads a picked file and keeps its id as the value', async () => {
	const { input, uploadFile, setValue } = renderFileInput(block());

	await userEvent.upload(input, file('report.pdf'));

	await waitFor(() => expect(setValue).toHaveBeenCalledWith('files', expect.objectContaining({ value: ['id-report.pdf'] })));
	expect(uploadFile).toHaveBeenCalledTimes(1);
	expect(screen.getByText('report.pdf')).toBeInTheDocument();
});

it('keeps the ids of every file of a multiple selection', async () => {
	const { input, setValue } = renderFileInput(block());

	await userEvent.upload(input, [file('a.txt'), file('b.txt')]);

	await waitFor(() => expect(setValue).toHaveBeenLastCalledWith('files', expect.objectContaining({ value: ['id-a.txt', 'id-b.txt'] })));
});

it('removes a file from the value', async () => {
	const { input, setValue } = renderFileInput(block());
	await userEvent.upload(input, [file('a.txt'), file('b.txt')]);
	expect(await screen.findByText('b.txt')).toBeInTheDocument();

	await userEvent.click(screen.getAllByRole('button', { name: 'UIKit_File_input_remove_file' })[0]);

	await waitFor(() => expect(setValue).toHaveBeenLastCalledWith('files', expect.objectContaining({ value: ['id-b.txt'] })));
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
	const { input, setValue } = renderFileInput(block(), { uploadFile: jest.fn().mockRejectedValue(new Error('nope')) });

	await userEvent.upload(input, file('a.txt'));

	expect(await screen.findByRole('alert')).toHaveTextContent('UIKit_File_input_upload_failed');
	expect(setValue).not.toHaveBeenCalled();
});

it('is disabled when the surface cannot store files', () => {
	const { input } = renderFileInput(block(), { uploadFile: undefined });

	expect(input).toBeDisabled();
	expect(screen.getByText('UIKit_File_input_unavailable')).toBeInTheDocument();
});

it('does not clear the upload flag or the value when an upload ends after the input unmounted', async () => {
	let finish: (uploaded: { _id: string; name: string }) => void = () => undefined;
	const uploadFile = jest.fn(
		() =>
			new Promise<{ _id: string; name: string }>((resolve) => {
				finish = resolve;
			}),
	);
	const { input, unmount, setUploading, setValue } = renderFileInput(block(), { uploadFile });

	await userEvent.upload(input, file('a.pdf'));
	unmount();
	setUploading.mockClear();
	finish({ _id: 'id-a', name: 'a.pdf' });
	await new Promise((resolve) => setTimeout(resolve, 0));

	expect(setUploading).not.toHaveBeenCalled();
	expect(setValue).not.toHaveBeenCalled();
});

it('leaves a file the user denied out of the value', async () => {
	jest.mocked(askConfirmation).mockResolvedValueOnce(false).mockResolvedValueOnce(true);
	const confirm = {
		title: { type: 'plain_text', text: 't' },
		text: { type: 'plain_text', text: 't' },
		confirm: { type: 'plain_text', text: 'y' },
		deny: { type: 'plain_text', text: 'n' },
	} as const;
	const { input, setValue } = renderFileInput(
		block({ confirm, dispatchActionConfig: ['on_item_selected'] } as Partial<UiKit.FileInputElement>),
	);

	await userEvent.upload(input, file('a.txt'));
	await waitFor(() => expect(askConfirmation).toHaveBeenCalledTimes(1));
	await userEvent.upload(input, file('b.txt'));

	await waitFor(() => expect(setValue).toHaveBeenLastCalledWith('files', expect.objectContaining({ value: ['id-b.txt'] })));
});
