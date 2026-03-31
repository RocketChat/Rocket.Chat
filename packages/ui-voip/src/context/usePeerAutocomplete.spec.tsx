import { UserStatus } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook, waitFor, act } from '@testing-library/react';

import type { PeerInfo } from './MediaCallContext';
import type { PeerAutocompleteOptions } from '../components';
import MediaCallContext, { defaultMediaCallContextValue } from './MediaCallContext';
import { usePeerAutocomplete, isFirstPeerAutocompleteOption } from './usePeerAutocomplete';

jest.mock('@rocket.chat/ui-contexts', () => ({
	...jest.requireActual('@rocket.chat/ui-contexts'),
	useUserPresence: jest.fn(() => ({ _id: 'user1', status: 'online' as const })),
}));

jest.useFakeTimers();

const mockGetAutocompleteOptions = jest.fn();
const mockOnSelectPeer = jest.fn();

const appRoot = () =>
	mockAppRoot()
		.wrap((children) => (
			<MediaCallContext.Provider
				value={{
					...defaultMediaCallContextValue,
					getAutocompleteOptions: mockGetAutocompleteOptions,
				}}
			>
				{children}
			</MediaCallContext.Provider>
		))
		.build();

beforeEach(() => {
	jest.clearAllMocks();
});

describe('isFirstPeerAutocompleteOption', () => {
	it('should return true for values starting with prefix', () => {
		expect(isFirstPeerAutocompleteOption('rcx-first-option-test')).toBe(true);
	});

	it('should return false for values not starting with prefix', () => {
		expect(isFirstPeerAutocompleteOption('test')).toBe(false);
	});
});

describe('hook', () => {
	it('should initialize with empty filter and no value', () => {
		mockGetAutocompleteOptions.mockResolvedValue([]);

		const { result } = renderHook(() => usePeerAutocomplete(mockOnSelectPeer, undefined), {
			wrapper: appRoot(),
		});

		expect(result.current.filter).toBe('');
		expect(result.current.value).toBeUndefined();
	});

	it('should update filter when onChangeFilter is called', async () => {
		mockGetAutocompleteOptions.mockResolvedValue([]);

		const { result } = renderHook(() => usePeerAutocomplete(mockOnSelectPeer, undefined), {
			wrapper: appRoot(),
		});

		act(() => {
			result.current.onChangeFilter('test');
		});

		expect(result.current.filter).toBe('test');
	});

	it('should fetch autocomplete options', async () => {
		const mockOptions: PeerAutocompleteOptions[] = [
			{ value: 'user1', label: 'User 1', avatarUrl: '' },
			{ value: 'user2', label: 'User 2', avatarUrl: '' },
		];
		mockGetAutocompleteOptions.mockResolvedValue(mockOptions);

		const { result } = renderHook(() => usePeerAutocomplete(mockOnSelectPeer, undefined), {
			wrapper: appRoot(),
		});

		await waitFor(() => {
			expect(result.current.options).toEqual(mockOptions);
		});
	});

	it('should add first option when filter is not empty', async () => {
		const mockOptions: PeerAutocompleteOptions[] = [{ value: 'user1', label: 'User 1', avatarUrl: '' }];
		mockGetAutocompleteOptions.mockResolvedValue(mockOptions);

		const { result } = renderHook(() => usePeerAutocomplete(mockOnSelectPeer, undefined), {
			wrapper: appRoot(),
		});

		act(() => {
			result.current.onChangeFilter('123');
		});

		await waitFor(() => {
			expect(result.current.options).toHaveLength(2);
			expect(result.current.options[0]).toEqual({
				value: 'rcx-first-option-123',
				label: '123',
				avatarUrl: '',
			});
		});
	});

	it('should return value when peerInfo has userId', () => {
		mockGetAutocompleteOptions.mockResolvedValue([]);
		const peerInfo: PeerInfo = { userId: 'user1', displayName: 'User 1' };

		const { result } = renderHook(() => usePeerAutocomplete(mockOnSelectPeer, peerInfo), {
			wrapper: appRoot(),
		});

		expect(result.current.value).toBe('user1');
	});

	it('should return undefined value when peerInfo has no userId', () => {
		mockGetAutocompleteOptions.mockResolvedValue([]);
		const peerInfo: PeerInfo = { number: '123456' };

		const { result } = renderHook(() => usePeerAutocomplete(mockOnSelectPeer, peerInfo), {
			wrapper: appRoot(),
		});

		expect(result.current.value).toBeUndefined();
	});

	describe('onChangeValue', () => {
		it('should do nothing if value is an array', async () => {
			mockGetAutocompleteOptions.mockResolvedValue([]);

			const { result } = renderHook(() => usePeerAutocomplete(mockOnSelectPeer, undefined), {
				wrapper: appRoot(),
			});

			act(() => {
				result.current.onChangeValue(['value1', 'value2']);
			});

			expect(mockOnSelectPeer).not.toHaveBeenCalled();
		});

		it('should call onSelectPeer with number when value is first option', async () => {
			mockGetAutocompleteOptions.mockResolvedValue([]);

			const { result } = renderHook(() => usePeerAutocomplete(mockOnSelectPeer, undefined), {
				wrapper: appRoot(),
			});

			act(() => {
				result.current.onChangeValue('rcx-first-option-123456');
			});

			expect(mockOnSelectPeer).toHaveBeenCalledWith({ number: '123456' });
		});

		it('should call onSelectPeer with full peer info when value matches option', async () => {
			const mockOptions: PeerAutocompleteOptions[] = [
				{ value: 'user1', label: 'User 1', avatarUrl: 'avatar.jpg', status: UserStatus.ONLINE },
			];
			mockGetAutocompleteOptions.mockResolvedValue(mockOptions);

			const { result } = renderHook(() => usePeerAutocomplete(mockOnSelectPeer, undefined), {
				wrapper: appRoot(),
			});

			await waitFor(() => {
				expect(result.current.options).toHaveLength(1);
			});

			act(() => {
				result.current.onChangeValue('user1');
			});

			expect(mockOnSelectPeer).toHaveBeenCalledWith({
				userId: 'user1',
				displayName: 'User 1',
				avatarUrl: 'avatar.jpg',
				status: UserStatus.ONLINE,
			});
		});

		it('should throw error when value does not match any option', async () => {
			mockGetAutocompleteOptions.mockResolvedValue([]);

			const { result } = renderHook(() => usePeerAutocomplete(mockOnSelectPeer, undefined), {
				wrapper: appRoot(),
			});

			await waitFor(() => {
				expect(result.current.options).toEqual([]);
			});

			expect(() => {
				act(() => {
					result.current.onChangeValue('unknown-user');
				});
			}).toThrow('Peer info not found for value: unknown-user');
		});
	});

	describe('onKeypadPress', () => {
		it('should append key to filter', async () => {
			mockGetAutocompleteOptions.mockResolvedValue([]);

			const { result } = renderHook(() => usePeerAutocomplete(mockOnSelectPeer, undefined), {
				wrapper: appRoot(),
			});

			act(() => {
				result.current.onKeypadPress('1');
			});

			expect(result.current.filter).toBe('1');

			act(() => {
				result.current.onKeypadPress('2');
			});

			expect(result.current.filter).toBe('12');

			act(() => {
				result.current.onKeypadPress('3');
			});

			expect(result.current.filter).toBe('123');
		});
	});

	describe('user presence updates', () => {
		it('should update peer status when user presence changes', async () => {
			const { useUserPresence } = await import('@rocket.chat/ui-contexts');
			const mockUseUserPresence = useUserPresence as jest.MockedFunction<typeof useUserPresence>;

			mockGetAutocompleteOptions.mockResolvedValue([]);
			const peerInfo: PeerInfo = { userId: 'user1', displayName: 'User 1', status: UserStatus.ONLINE };

			mockUseUserPresence.mockReturnValue({ _id: 'user1', status: UserStatus.AWAY, statusText: '' });

			renderHook(() => usePeerAutocomplete(mockOnSelectPeer, peerInfo), {
				wrapper: appRoot(),
			});

			await waitFor(() => {
				expect(mockOnSelectPeer).toHaveBeenCalledWith({
					...peerInfo,
					status: 'away',
				});
			});
		});

		it('should not update peer status when status has not changed', async () => {
			const { useUserPresence } = await import('@rocket.chat/ui-contexts');
			const mockUseUserPresence = useUserPresence as jest.MockedFunction<typeof useUserPresence>;

			mockGetAutocompleteOptions.mockResolvedValue([]);
			const peerInfo: PeerInfo = { userId: 'user1', displayName: 'User 1', status: UserStatus.ONLINE };

			mockUseUserPresence.mockReturnValue({ _id: 'user1', status: UserStatus.ONLINE, statusText: '' });

			renderHook(() => usePeerAutocomplete(mockOnSelectPeer, peerInfo), {
				wrapper: appRoot(),
			});

			await waitFor(() => {
				expect(mockOnSelectPeer).not.toHaveBeenCalled();
			});
		});

		it('should not update when peerInfo is undefined', async () => {
			const { useUserPresence } = await import('@rocket.chat/ui-contexts');
			const mockUseUserPresence = useUserPresence as jest.MockedFunction<typeof useUserPresence>;

			mockGetAutocompleteOptions.mockResolvedValue([]);
			mockUseUserPresence.mockReturnValue({ _id: 'user1', status: UserStatus.ONLINE, statusText: '' });

			renderHook(() => usePeerAutocomplete(mockOnSelectPeer, undefined), {
				wrapper: appRoot(),
			});

			await waitFor(() => {
				expect(mockOnSelectPeer).not.toHaveBeenCalled();
			});
		});

		it('should not update when peerInfo has no status property', async () => {
			const { useUserPresence } = await import('@rocket.chat/ui-contexts');
			const mockUseUserPresence = useUserPresence as jest.MockedFunction<typeof useUserPresence>;

			mockGetAutocompleteOptions.mockResolvedValue([]);
			const peerInfo: PeerInfo = { number: '123456' };

			mockUseUserPresence.mockReturnValue({ _id: 'user1', status: UserStatus.ONLINE, statusText: '' });

			renderHook(() => usePeerAutocomplete(mockOnSelectPeer, peerInfo), {
				wrapper: appRoot(),
			});

			await waitFor(() => {
				expect(mockOnSelectPeer).not.toHaveBeenCalled();
			});
		});

		it('should not update when useUserPresence returns no status', async () => {
			const { useUserPresence } = await import('@rocket.chat/ui-contexts');
			const mockUseUserPresence = useUserPresence as jest.MockedFunction<typeof useUserPresence>;

			mockGetAutocompleteOptions.mockResolvedValue([]);
			const peerInfo: PeerInfo = { userId: 'user1', displayName: 'User 1', status: UserStatus.ONLINE };

			mockUseUserPresence.mockReturnValue(undefined);

			renderHook(() => usePeerAutocomplete(mockOnSelectPeer, peerInfo), {
				wrapper: appRoot(),
			});

			await waitFor(() => {
				expect(mockOnSelectPeer).not.toHaveBeenCalled();
			});
		});
	});
});
