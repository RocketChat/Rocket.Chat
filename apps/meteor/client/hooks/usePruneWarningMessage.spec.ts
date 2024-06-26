import type { IRoomWithRetentionPolicy } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook } from '@testing-library/react-hooks';

import { createFakeRoom } from '../../tests/mocks/data';
import { usePruneWarningMessage } from './usePruneWarningMessage';

const createMock = ({
	enabled = true,
	filesOnly = false,
	doNotPrunePinned = false,
	appliesToChannels = false,
	TTLChannels = 60000,
	appliesToGroups = false,
	TTLGroups = 60000,
	appliesToDMs = false,
	TTLDMs = 60000,
	precision = '0',
	advancedPrecision = false,
	advancedPrecisionCron = '*/30 * * * *',
} = {}) => {
	return mockAppRoot()
		.withTranslations('en', 'core', {
			RetentionPolicy_RoomWarning_NextRunDate: '{{maxAge}} {{nextRunDate}}',
			RetentionPolicy_RoomWarning_Unpinned_NextRunDate: 'Unpinned {{maxAge}} {{nextRunDate}}',
			RetentionPolicy_RoomWarning_FilesOnly_NextRunDate: 'FilesOnly {{maxAge}} {{nextRunDate}}',
			RetentionPolicy_RoomWarning_UnpinnedFilesOnly_NextRunDate: 'UnpinnedFilesOnly {{maxAge}} {{nextRunDate}}',
		})
		.withSetting('RetentionPolicy_Enabled', enabled)
		.withSetting('RetentionPolicy_FilesOnly', filesOnly)
		.withSetting('RetentionPolicy_DoNotPrunePinned', doNotPrunePinned)
		.withSetting('RetentionPolicy_AppliesToChannels', appliesToChannels)
		.withSetting('RetentionPolicy_TTL_Channels', TTLChannels)
		.withSetting('RetentionPolicy_AppliesToGroups', appliesToGroups)
		.withSetting('RetentionPolicy_TTL_Groups', TTLGroups)
		.withSetting('RetentionPolicy_AppliesToDMs', appliesToDMs)
		.withSetting('RetentionPolicy_TTL_DMs', TTLDMs)
		.withSetting('RetentionPolicy_Precision', precision)
		.withSetting('RetentionPolicy_Advanced_Precision', advancedPrecision)
		.withSetting('RetentionPolicy_Advanced_Precision_Cron', advancedPrecisionCron)
		.build();
};

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

const setDate = (minutes = 1, hours = 0, date = 1) => {
	// June 12, 2024, 12:00 AM
	const fakeDate = new Date();
	fakeDate.setFullYear(2024);
	fakeDate.setMonth(5);
	fakeDate.setDate(date);
	fakeDate.setHours(hours);
	fakeDate.setMinutes(minutes);
	fakeDate.setSeconds(0);
	jest.setSystemTime(fakeDate);
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
