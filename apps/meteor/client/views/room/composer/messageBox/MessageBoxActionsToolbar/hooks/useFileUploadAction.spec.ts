import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook, waitFor } from '@testing-library/react';

import { useFileUploadAction } from './useFileUploadAction';

const fileInput = document.createElement('input');
const uploadFiles = jest.fn();

jest.mock('./useFileInput', () => ({
	useFileInput: () => ({ current: fileInput }),
}));

jest.mock('../../../../contexts/ChatContext', () => ({
	useChat: () => ({ flows: { uploadFiles } }),
}));

const select = (file: File) => {
	Object.defineProperty(fileInput, 'files', { value: [file], configurable: true });
	fileInput.dispatchEvent(new Event('change'));
};

it('should upload each selection when a second one arrives before the first is handled', async () => {
	renderHook(() => useFileUploadAction(false), { wrapper: mockAppRoot().build() });

	const first = new File(['test file'], 'any_file.txt', { type: 'text/plain' });
	const second = new File([''], 'empty_file.txt', { type: 'text/plain' });
	select(first);
	select(second);

	await waitFor(() => expect(uploadFiles).toHaveBeenCalledTimes(2));
	expect(uploadFiles.mock.calls[0][0].files[0]).toBe(first);
	expect(uploadFiles.mock.calls[1][0].files[0]).toBe(second);
});
