import type { IRoomWithRetentionPolicy } from '@rocket.chat/core-typings';
import { renderHook } from '@testing-library/react-hooks';

import { createRenteionPolicySettingsMock as createMock } from '../../tests/mocks/client/mockRetentionPolicySettings';
import { createFakeRoom } from '../../tests/mocks/data';
import { setDate } from '../../tests/mocks/mockDate';
import { usePruneWarningMessage } from './usePruneWarningMessage';

jest.useFakeTimers();

const getRetentionRoomProps = (props: Partial<IRoomWithRetentionPolicy['retention']> = {}) => {
	return {
		retention: {
			enabled: true,
			overrideGlobal: true,
			maxAge: 30,
			filesOnly: false,
			excludePinned: false,
			ignoreThreads: false,
			...props,
		},
	};
};

describe('usePruneWarningMessage hook', () => {
	describe('Cron timer and precision', () => {
		it('Should update the message after the nextRunDate has passaed', async () => {
			setDate();
			const fakeRoom = createFakeRoom({ t: 'c' });
			const { result } = renderHook(() => usePruneWarningMessage(fakeRoom), {
				wrapper: createMock({
					appliesToChannels: true,
					TTLChannels: 60000,
				}),
			});
			expect(result.current).toEqual('a minute June 1, 2024, 12:30 AM');
			jest.advanceTimersByTime(31 * 60 * 1000);
			expect(result.current).toEqual('a minute June 1, 2024, 1:00 AM');
		});

		it('Should return the default warning with precision set to every_hour', () => {
			const fakeRoom = createFakeRoom({ t: 'c' });
			setDate();
			const { result } = renderHook(() => usePruneWarningMessage(fakeRoom), {
				wrapper: createMock({
					appliesToChannels: true,
					TTLChannels: 60000,
					precision: '1',
				}),
			});
			expect(result.current).toEqual('a minute June 1, 2024, 1:00 AM');
		});

		it('Should return the default warning with precision set to every_six_hours', () => {
			const fakeRoom = createFakeRoom({ t: 'c' });
			setDate();
			const { result } = renderHook(() => usePruneWarningMessage(fakeRoom), {
				wrapper: createMock({
					appliesToChannels: true,
					TTLChannels: 60000,
					precision: '2',
				}),
			});
			expect(result.current).toEqual('a minute June 1, 2024, 6:00 AM');
		});

		it('Should return the default warning with precision set to every_day', () => {
			const fakeRoom = createFakeRoom({ t: 'c' });
			setDate();
			const { result } = renderHook(() => usePruneWarningMessage(fakeRoom), {
				wrapper: createMock({
					appliesToChannels: true,
					TTLChannels: 60000,
					precision: '3',
				}),
			});
			expect(result.current).toEqual('a minute June 2, 2024, 12:00 AM');
		});

		it('Should return the default warning with advanced precision', () => {
			const fakeRoom = createFakeRoom({ t: 'c' });
			setDate();
			const { result } = renderHook(() => usePruneWarningMessage(fakeRoom), {
				wrapper: createMock({
					appliesToChannels: true,
					TTLChannels: 60000,
					advancedPrecision: true,
					advancedPrecisionCron: '0 0 1 */1 *',
				}),
			});
			expect(result.current).toEqual('a minute July 1, 2024, 12:00 AM');
		});
	});

	describe('No override', () => {
		it('Should return the default warning', () => {
			const fakeRoom = createFakeRoom({ t: 'c' });
			setDate();
			const { result } = renderHook(() => usePruneWarningMessage(fakeRoom), {
				wrapper: createMock({
					appliesToChannels: true,
					TTLChannels: 60000,
				}),
			});
			expect(result.current).toEqual('a minute June 1, 2024, 12:30 AM');
		});

		it('Should return the unpinned messages warning', () => {
			const fakeRoom = createFakeRoom({ t: 'c' });
			setDate();
			const { result } = renderHook(() => usePruneWarningMessage(fakeRoom), {
				wrapper: createMock({
					appliesToChannels: true,
					TTLChannels: 60000,
					doNotPrunePinned: true,
				}),
			});
			expect(result.current).toEqual('Unpinned a minute June 1, 2024, 12:30 AM');
		});

		it('Should return the files only warning', () => {
			const fakeRoom = createFakeRoom({ t: 'c' });
			setDate();

			const { result } = renderHook(() => usePruneWarningMessage(fakeRoom), {
				wrapper: createMock({
					appliesToChannels: true,
					TTLChannels: 60000,
					filesOnly: true,
				}),
			});
			expect(result.current).toEqual('FilesOnly a minute June 1, 2024, 12:30 AM');
		});

		it('Should return the unpinned files only warning', () => {
			const fakeRoom = createFakeRoom({ t: 'c' });
			setDate();

			const { result } = renderHook(() => usePruneWarningMessage(fakeRoom), {
				wrapper: createMock({
					appliesToChannels: true,
					TTLChannels: 60000,
					filesOnly: true,
					doNotPrunePinned: true,
				}),
			});
			expect(result.current).toEqual('UnpinnedFilesOnly a minute June 1, 2024, 12:30 AM');
		});
	});

	describe('Overriden', () => {
		it('Should return the default warning', () => {
			const fakeRoom = createFakeRoom({ t: 'p', ...getRetentionRoomProps() });
			setDate();
			const { result } = renderHook(() => usePruneWarningMessage(fakeRoom), {
				wrapper: createMock(),
			});
			expect(result.current).toEqual('30 days June 1, 2024, 12:30 AM');
		});

		it('Should return the unpinned messages warning', () => {
			const fakeRoom = createFakeRoom({ t: 'p', ...getRetentionRoomProps({ excludePinned: true }) });
			setDate();
			const { result } = renderHook(() => usePruneWarningMessage(fakeRoom), {
				wrapper: createMock(),
			});
			expect(result.current).toEqual('Unpinned 30 days June 1, 2024, 12:30 AM');
		});

		it('Should return the files only warning', () => {
			const fakeRoom = createFakeRoom({ t: 'p', ...getRetentionRoomProps({ filesOnly: true }) });
			setDate();

			const { result } = renderHook(() => usePruneWarningMessage(fakeRoom), {
				wrapper: createMock(),
			});
			expect(result.current).toEqual('FilesOnly 30 days June 1, 2024, 12:30 AM');
		});

		it('Should return the unpinned files only warning', () => {
			const fakeRoom = createFakeRoom({ t: 'p', ...getRetentionRoomProps({ excludePinned: true, filesOnly: true }) });
			setDate();

			const { result } = renderHook(() => usePruneWarningMessage(fakeRoom), {
				wrapper: createMock(),
			});
			expect(result.current).toEqual('UnpinnedFilesOnly 30 days June 1, 2024, 12:30 AM');
		});
	});
});
