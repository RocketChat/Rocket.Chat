import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, renderHook } from '@testing-library/react';

import { useClipboardWithToast } from './useClipboardWithToast';

const writeText = jest.fn();

beforeAll(() => {
	Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
});

afterEach(() => {
	writeText.mockReset();
});

it('should dispatch a success toast when the text is copied', async () => {
	writeText.mockResolvedValue(undefined);
	const dispatch = jest.fn();

	const { result } = renderHook(() => useClipboardWithToast('some text'), {
		wrapper: mockAppRoot().withToastMessageDispatch(dispatch).build(),
	});

	await act(() => result.current.copy());

	expect(writeText).toHaveBeenCalledWith('some text');
	expect(dispatch).toHaveBeenCalledWith({ type: 'success', message: 'Copied' });
});

it('should dispatch an error toast when copying fails', async () => {
	const error = new Error('denied');
	writeText.mockRejectedValue(error);
	const dispatch = jest.fn();

	const { result } = renderHook(() => useClipboardWithToast('some text'), {
		wrapper: mockAppRoot().withToastMessageDispatch(dispatch).build(),
	});

	await act(() => result.current.copy());

	expect(dispatch).toHaveBeenCalledWith({ type: 'error', message: error });
});
