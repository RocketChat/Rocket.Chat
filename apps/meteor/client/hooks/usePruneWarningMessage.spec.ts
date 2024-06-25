import type { IRoomWithRetentionPolicy } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, renderHook } from '@testing-library/react';

import { createFakeRoom } from '../../tests/mocks/data';
import { usePruneWarningMessage } from './usePruneWarningMessage';

const renderUsePruneWarningMessage = ({
	room = createFakeRoom({ t: 'c' }),
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
} = {}) =>
	renderHook(() => usePruneWarningMessage(room), {
		legacyRoot: true,
		wrapper: mockAppRoot()
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
			.build(),
	});

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

beforeEach(() => {
	/*
		It's not the same as `Date.parse('2024-06-01T00:01:00.000Z')`!
		The date is created *at the same timezone of the node process* instead of fixed at UTC.
	 */
	const fakeDate = new Date(2024, 5, 1, 0, 1, 0);
	jest.setSystemTime(fakeDate);
});

describe('Cron timer and precision', () => {
	it('Should update the message after the nextRunDate has passaed', async () => {
		const { result } = renderUsePruneWarningMessage({
			appliesToChannels: true,
			TTLChannels: 60000,
		});

		expect(result.current).toEqual('a minute June 1, 2024, 12:30 AM');

		act(() => {
			jest.advanceTimersByTime(31 * 60 * 1000);
		});

		expect(result.current).toEqual('a minute June 1, 2024, 1:00 AM');
	});

	it('Should return the default warning with precision set to every_hour', () => {
		const { result } = renderUsePruneWarningMessage({
			appliesToChannels: true,
			TTLChannels: 60000,
			precision: '1',
		});

		expect(result.current).toEqual('a minute June 1, 2024, 1:00 AM');
	});

	it('Should return the default warning with precision set to every_six_hours', () => {
		const { result } = renderUsePruneWarningMessage({
			appliesToChannels: true,
			TTLChannels: 60000,
			precision: '2',
		});

		expect(result.current).toEqual('a minute June 1, 2024, 6:00 AM');
	});

	it('Should return the default warning with precision set to every_day', () => {
		const { result } = renderUsePruneWarningMessage({
			appliesToChannels: true,
			TTLChannels: 60000,
			precision: '3',
		});

		expect(result.current).toEqual('a minute June 2, 2024, 12:00 AM');
	});

	it('Should return the default warning with advanced precision', () => {
		const { result } = renderUsePruneWarningMessage({
			appliesToChannels: true,
			TTLChannels: 60000,
			advancedPrecision: true,
			advancedPrecisionCron: '0 0 1 */1 *',
		});

		expect(result.current).toEqual('a minute July 1, 2024, 12:00 AM');
	});
});

describe('No override', () => {
	it('Should return the default warning', () => {
		const { result } = renderUsePruneWarningMessage({
			appliesToChannels: true,
			TTLChannels: 60000,
		});

		expect(result.current).toEqual('a minute June 1, 2024, 12:30 AM');
	});

	it('Should return the unpinned messages warning', () => {
		const { result } = renderUsePruneWarningMessage({
			appliesToChannels: true,
			TTLChannels: 60000,
			doNotPrunePinned: true,
		});

		expect(result.current).toEqual('Unpinned a minute June 1, 2024, 12:30 AM');
	});

	it('Should return the files only warning', () => {
		const { result } = renderUsePruneWarningMessage({
			appliesToChannels: true,
			TTLChannels: 60000,
			filesOnly: true,
		});

		expect(result.current).toEqual('FilesOnly a minute June 1, 2024, 12:30 AM');
	});

	it('Should return the unpinned files only warning', () => {
		const { result } = renderUsePruneWarningMessage({
			appliesToChannels: true,
			TTLChannels: 60000,
			filesOnly: true,
			doNotPrunePinned: true,
		});

		expect(result.current).toEqual('UnpinnedFilesOnly a minute June 1, 2024, 12:30 AM');
	});
});

describe('Overriden', () => {
	it('Should return the default warning', () => {
		const { result } = renderUsePruneWarningMessage({
			room: createFakeRoom({ t: 'p', ...getRetentionRoomProps() }),
		});

		expect(result.current).toEqual('30 days June 1, 2024, 12:30 AM');
	});

	it('Should return the unpinned messages warning', () => {
		const { result } = renderUsePruneWarningMessage({
			room: createFakeRoom({ t: 'p', ...getRetentionRoomProps({ excludePinned: true }) }),
		});

		expect(result.current).toEqual('Unpinned 30 days June 1, 2024, 12:30 AM');
	});

	it('Should return the files only warning', () => {
		const { result } = renderUsePruneWarningMessage({
			room: createFakeRoom({ t: 'p', ...getRetentionRoomProps({ filesOnly: true }) }),
		});

		expect(result.current).toEqual('FilesOnly 30 days June 1, 2024, 12:30 AM');
	});

	it('Should return the unpinned files only warning', () => {
		const { result } = renderUsePruneWarningMessage({
			room: createFakeRoom({ t: 'p', ...getRetentionRoomProps({ excludePinned: true, filesOnly: true }) }),
		});

		expect(result.current).toEqual('UnpinnedFilesOnly 30 days June 1, 2024, 12:30 AM');
	});
});
