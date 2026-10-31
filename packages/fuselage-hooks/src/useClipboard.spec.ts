import { renderHook, act } from './testing';
import { useClipboard } from './useClipboard';
import { withClipboardMock } from '../mocks/withClipboardMock';

let container: Element | undefined;

beforeAll(() => {
	jest.useFakeTimers();
});

beforeEach(() => {
	container = document.createElement('div');
	document.body.appendChild(container);
});

afterEach(() => {
	container?.remove();
	container = undefined;
});

const withWriteText = withClipboardMock();

it('has hasCopied and copy properties', () => {
	const { result } = renderHook(() => useClipboard('Lorem Ipsum'));

	const { copy, hasCopied } = result.current;

	expect(copy).toBeInstanceOf(Function);
	expect(hasCopied).toBe(false);
});

it('updates hasCopied to true', async () => {
	const { result } = renderHook(() => useClipboard('Lorem Ipsum'));

	await act(async () => {
		const { copy } = result.current;
		await copy();
	});

	expect(result.current.hasCopied).toBe(true);
});

it('reverts hasCopied to false', async () => {
	const halfDelay = 50;
	const delay = 2 * halfDelay;

	const { result } = renderHook(() => useClipboard('Lorem Ipsum', { clearTime: delay }));

	await act(async () => {
		const { copy } = result.current;
		await copy();
	});

	expect(result.current.hasCopied).toBe(true);

	act(() => {
		jest.advanceTimersByTime(halfDelay);
	});

	expect(result.current.hasCopied).toBe(true);

	act(() => {
		jest.advanceTimersByTime(halfDelay);
	});

	expect(result.current.hasCopied).toBe(false);
});

it('runs only success function receiving event object', async () => {
	const onCopySuccess = jest.fn();
	const onCopyError = jest.fn();

	const { result } = renderHook(() =>
		useClipboard('Lorem Ipsum', {
			onCopySuccess,
			onCopyError,
		}),
	);

	const event = new MouseEvent('click');

	await act(async () => {
		const { copy } = result.current;
		await copy(event);
	});

	expect(onCopySuccess).toHaveBeenCalledWith(event);
	expect(onCopyError).toHaveBeenCalledTimes(0);
});

it('runs only error function receiving error object', async () => {
	const rejection = new Error('rejected');
	withWriteText(() => Promise.reject(rejection));

	const onCopyError = jest.fn();
	const onCopySuccess = jest.fn();

	const { result } = renderHook(() =>
		useClipboard('Lorem Ipsum', {
			onCopySuccess,
			onCopyError,
		}),
	);

	const event = new MouseEvent('click');

	await act(async () => {
		const { copy } = result.current;
		await copy(event);
	});

	expect(onCopySuccess).toHaveBeenCalledTimes(0);
	expect(onCopyError).toHaveBeenCalledWith(rejection);
});
