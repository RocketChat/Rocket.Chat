import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, renderHook } from '@testing-library/react';

import { useCopyWithToast } from './useCopyWithToast';

const writeText = jest.fn();

beforeAll(() => {
	Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
});

afterEach(() => {
	writeText.mockReset();
});

const renderCopy = () => {
	const dispatch = jest.fn();
	const { result } = renderHook(() => useCopyWithToast(), {
		wrapper: mockAppRoot().withToastMessageDispatch(dispatch).build(),
	});

	return { copy: result.current, dispatch };
};

it('copies the text it is given and says it was copied', async () => {
	writeText.mockResolvedValue(undefined);
	const { copy, dispatch } = renderCopy();

	await act(() => copy('some text'));

	expect(writeText).toHaveBeenCalledWith('some text');
	expect(dispatch).toHaveBeenCalledWith({ type: 'success', message: 'Copied' });
});

// One hook serves a list of things to copy, so each call copies its own text.
it('copies a different text on each call', async () => {
	writeText.mockResolvedValue(undefined);
	const { copy } = renderCopy();

	await act(() => copy('first'));
	await act(() => copy('second'));

	expect(writeText.mock.calls).toEqual([['first'], ['second']]);
});

it('tells the user when copying fails', async () => {
	const error = new Error('denied');
	writeText.mockRejectedValue(error);
	const { copy, dispatch } = renderCopy();

	await act(() => copy('some text'));

	expect(dispatch).toHaveBeenCalledWith({ type: 'error', message: error });
	expect(dispatch).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'success' }));
});
