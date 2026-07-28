import { renderHook, act } from '@testing-library/react';

import { useMediaDuration } from './useMediaDuration';

interface IFakeAudio extends HTMLAudioElement {
	_emit: (type: string) => void;
	_setDuration: (value: number) => void;
}

describe('useMediaDuration', () => {
	let created: IFakeAudio[];
	const OriginalAudio = global.Audio;

	beforeEach(() => {
		created = [];
		global.Audio = jest.fn().mockImplementation(() => {
			const el = document.createElement('audio') as IFakeAudio;
			let value = NaN;
			Object.defineProperty(el, 'duration', { configurable: true, get: () => value });
			el._setDuration = (next: number) => {
				value = next;
			};
			el._emit = (type: string) => el.dispatchEvent(new Event(type));
			jest.spyOn(el, 'load').mockImplementation(() => undefined);
			created.push(el);
			return el;
		}) as unknown as typeof Audio;
	});

	afterEach(() => {
		global.Audio = OriginalAudio;
		jest.restoreAllMocks();
	});

	const resolveMetadata = (el: IFakeAudio, value: number) => {
		act(() => {
			el._setDuration(value);
			el._emit('loadedmetadata');
		});
	};

	it('resolves the duration from metadata without playing', () => {
		const { result } = renderHook(() => useMediaDuration('/audio-a.mp3'));
		expect(result.current).toBe(0);
		expect(created).toHaveLength(1);

		resolveMetadata(created[0], 120);
		expect(result.current).toBe(120);
	});

	it('ignores a non-finite or zero duration', () => {
		const { result } = renderHook(() => useMediaDuration('/audio-b.mp3'));

		resolveMetadata(created[0], Infinity);
		resolveMetadata(created[0], 0);

		expect(result.current).toBe(0);
	});

	it('serves a cached duration without a new metadata request', () => {
		const src = '/audio-c.mp3';
		const { result: firstResult } = renderHook(() => useMediaDuration(src));
		resolveMetadata(created[0], 90);
		expect(firstResult.current).toBe(90);

		const { result: secondResult } = renderHook(() => useMediaDuration(src));
		expect(secondResult.current).toBe(90);
		expect(created).toHaveLength(1);
	});

	it('resets to 0 when the source changes to an unresolved one', () => {
		const { result, rerender } = renderHook(({ src }) => useMediaDuration(src), {
			initialProps: { src: '/audio-d.mp3' },
		});
		resolveMetadata(created[0], 75);
		expect(result.current).toBe(75);

		rerender({ src: '/audio-e.mp3' });
		expect(result.current).toBe(0);
	});

	it('aborts the pending metadata request on unmount', () => {
		const { unmount } = renderHook(() => useMediaDuration('/audio-f.mp3'));
		const el = created[0];
		expect(el.getAttribute('src')).not.toBeNull();

		unmount();
		expect(el.getAttribute('src')).toBeNull();
	});
});
