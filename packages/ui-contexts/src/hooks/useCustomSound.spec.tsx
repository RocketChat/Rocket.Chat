import { renderHook, act } from '@testing-library/react';
import type { ReactNode } from 'react';

import { useCustomSound } from './useCustomSound';
import { CustomSoundContext } from '../CustomSoundContext';

// Mock CustomSounds class core functionality
const mockCustomSounds = {
	play: jest.fn().mockImplementation(() => Promise.resolve(new Audio())),
	pause: jest.fn(),
	stop: jest.fn(),
	getList: jest.fn().mockReturnValue([
		{ _id: 'sound1', name: 'Sound 1', extension: 'mp3' },
		{ _id: 'sound2', name: 'Sound 2', extension: 'mp3' },
	]),
	isPlaying: jest.fn().mockReturnValue(false),
};

const wrapper = ({ children }: { children: ReactNode }) => <CustomSoundContext.Provider children={children} value={mockCustomSounds} />;

describe('useCustomSound', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should provide sound control methods', () => {
		const { result } = renderHook(() => useCustomSound(), { wrapper, legacyRoot: true });

		expect(result.current.play).toBeDefined();
		expect(result.current.pause).toBeDefined();
		expect(result.current.stop).toBeDefined();
		expect(result.current.getList).toBeDefined();
		expect(result.current.isPlaying).toBeDefined();
	});

	it('should call play with correct parameters', async () => {
		const { result } = renderHook(() => useCustomSound(), { wrapper, legacyRoot: true });

		await act(async () => {
			await result.current.play('test-sound', { volume: 0.5, loop: true });
		});

		expect(mockCustomSounds.play).toHaveBeenCalledWith('test-sound', {
			volume: 0.5,
			loop: true,
		});
	});

	it('should call pause with sound id', () => {
		const { result } = renderHook(() => useCustomSound(), { wrapper, legacyRoot: true });

		act(() => {
			result.current.pause('test-sound');
		});

		expect(mockCustomSounds.pause).toHaveBeenCalledWith('test-sound');
	});

	it('should call stop with sound id', () => {
		const { result } = renderHook(() => useCustomSound(), { wrapper, legacyRoot: true });

		act(() => {
			result.current.stop('test-sound');
		});

		expect(mockCustomSounds.stop).toHaveBeenCalledWith('test-sound');
	});

	it('should call getList method', () => {
		const { result } = renderHook(() => useCustomSound(), { wrapper, legacyRoot: true });

		result.current.getList();

		expect(mockCustomSounds.getList).toHaveBeenCalled();
	});

	it('should check if sound is playing', () => {
		const { result } = renderHook(() => useCustomSound(), { wrapper, legacyRoot: true });

		mockCustomSounds.isPlaying.mockReturnValue(true);
		const isPlaying = result.current.isPlaying('test-sound');

		expect(mockCustomSounds.isPlaying).toHaveBeenCalledWith('test-sound');
		expect(isPlaying).toBe(true);
	});
});
