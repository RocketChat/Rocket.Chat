import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook } from '@testing-library/react';

import { useRetentionPolicy } from './useRetentionPolicy';
import { createFakeRoom } from '../../../../tests/mocks/data';

const getGlobalSettings = ({
	enabled = false,
	filesOnly = false,
	doNotPrunePinned = false,
	ignoreThreads = false,
	appliesToChannels = false,
	appliesToGroups = false,
	appliesToDMs = false,
}) => {
	return mockAppRoot()
		.withSetting('RetentionPolicy_Enabled', enabled)
		.withSetting('RetentionPolicy_FilesOnly', filesOnly)
		.withSetting('RetentionPolicy_DoNotPrunePinned', doNotPrunePinned)
		.withSetting('RetentionPolicy_DoNotPruneThreads', ignoreThreads)
		.withSetting('RetentionPolicy_AppliesToChannels', appliesToChannels)
		.withSetting('RetentionPolicy_AppliesToGroups', appliesToGroups)
		.withSetting('RetentionPolicy_AppliesToDMs', appliesToDMs);
};

const defaultValue = {
	enabled: false,
	isActive: false,
	filesOnly: false,
	excludePinned: false,
	ignoreThreads: false,
};

const roomTypeConfig = {
	c: { appliesToChannels: true },
	p: { appliesToGroups: true },
	d: { appliesToDMs: true },
};

const CHANNELS_TYPE = 'c';

it('should return the default value if global retention is not enabled', async () => {
	const fakeRoom = createFakeRoom({ t: CHANNELS_TYPE });

	const { result } = renderHook(() => useRetentionPolicy(fakeRoom), {
		wrapper: getGlobalSettings({}).build(),
	});

	expect(result.current).toEqual(expect.objectContaining(defaultValue));
});

it('should return enabled true if global retention is enabled', async () => {
	const fakeRoom = createFakeRoom({ t: CHANNELS_TYPE });

	const { result } = renderHook(() => useRetentionPolicy(fakeRoom), {
		wrapper: getGlobalSettings({ enabled: true }).build(),
	});

	expect(result.current).toEqual(expect.objectContaining({ ...defaultValue, enabled: true }));
});

it('should return enabled and active true global retention is active for rooms of the type', async () => {
	const fakeRoom = createFakeRoom({ t: CHANNELS_TYPE });

	const { result } = renderHook(() => useRetentionPolicy(fakeRoom), {
		wrapper: getGlobalSettings({ enabled: true, ...roomTypeConfig[CHANNELS_TYPE] }).build(),
	});

	expect(result.current).toEqual(expect.objectContaining({ ...defaultValue, enabled: true, isActive: true }));
});

it('should isActive be false if global retention is active for rooms of the type and room has retention.enabled false', async () => {
	const fakeRoom = createFakeRoom({ t: CHANNELS_TYPE, retention: { enabled: false } });

	const { result } = renderHook(() => useRetentionPolicy(fakeRoom), {
		wrapper: getGlobalSettings({ enabled: true, ...roomTypeConfig[CHANNELS_TYPE] }).build(),
	});

	expect(result.current?.isActive).toBe(false);
});
