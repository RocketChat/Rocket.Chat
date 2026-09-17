import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { DragEvent } from 'react';

import { useLicenseFileInput } from './useLicenseFileInput';

const CURRENT_LICENSE = 'current-license-key';

const txtFile = (content: string, name = 'license.txt') => new File([content], name, { type: 'text/plain' });

const dragEvent = (types: string[], file?: File) =>
	({
		preventDefault: jest.fn(),
		stopPropagation: jest.fn(),
		dataTransfer: { types, dropEffect: '', files: file ? [file] : [] },
	}) as unknown as DragEvent<HTMLElement>;

const renderInput = (initial = CURRENT_LICENSE) => renderHook(() => useLicenseFileInput(initial), { wrapper: mockAppRoot().build() });

it('should seed the license with the current license', () => {
	const { result } = renderInput();

	expect(result.current.license).toBe(CURRENT_LICENSE);
	expect(result.current.selectedFile).toBeUndefined();
	expect(result.current.fileError).toBeUndefined();
});

it('should read a .txt file into the license and expose the selected file', async () => {
	const { result } = renderInput('');

	await act(async () => {
		await result.current.handleFile(txtFile('license-from-file'));
	});

	expect(result.current.license).toBe('license-from-file');
	expect(result.current.selectedFile?.name).toBe('license.txt');
	expect(result.current.fileError).toBeUndefined();
});

it('should reject a non-txt file without touching the license', async () => {
	const { result } = renderInput(CURRENT_LICENSE);

	await act(async () => {
		await result.current.handleFile(new File(['nope'], 'license.png', { type: 'image/png' }));
	});

	expect(result.current.fileError).toBe('Only_txt_license_files_are_supported');
	expect(result.current.selectedFile).toBeUndefined();
	expect(result.current.license).toBe(CURRENT_LICENSE);
});

it('should clear file state and license when the file is removed', async () => {
	const { result } = renderInput('');

	await act(async () => {
		await result.current.handleFile(txtFile('license-from-file'));
	});
	act(() => result.current.handleRemoveFile());

	expect(result.current.license).toBe('');
	expect(result.current.selectedFile).toBeUndefined();
	expect(result.current.fileError).toBeUndefined();
});

it('should detach the selected file when the text is edited by hand', async () => {
	const { result } = renderInput('');

	await act(async () => {
		await result.current.handleFile(txtFile('license-from-file'));
	});
	act(() => {
		result.current.handleTextChange({ currentTarget: { value: 'typed-by-hand' } } as any);
	});

	expect(result.current.license).toBe('typed-by-hand');
	expect(result.current.selectedFile).toBeUndefined();
	expect(result.current.fileError).toBeUndefined();
});

it('should flag drag-over only for file drags and set the copy drop effect', () => {
	const { result } = renderInput();

	const fileDrag = dragEvent(['Files']);
	act(() => result.current.handleDragOver(fileDrag));
	expect(result.current.isDragOver).toBe(true);
	expect(fileDrag.preventDefault).toHaveBeenCalled();
	expect(fileDrag.dataTransfer.dropEffect).toBe('copy');
});

it('should ignore text drags so the textarea handles them natively', () => {
	const { result } = renderInput();

	const textDrag = dragEvent(['text/plain']);
	act(() => result.current.handleDragOver(textDrag));

	expect(result.current.isDragOver).toBe(false);
	expect(textDrag.preventDefault).not.toHaveBeenCalled();
});

it('should read the dropped file and clear the drag-over state', async () => {
	const { result } = renderInput('');

	act(() => result.current.handleDragOver(dragEvent(['Files'])));
	act(() => result.current.handleDrop(dragEvent(['Files'], txtFile('dropped-license'))));

	expect(result.current.isDragOver).toBe(false);
	await waitFor(() => expect(result.current.license).toBe('dropped-license'));
});
