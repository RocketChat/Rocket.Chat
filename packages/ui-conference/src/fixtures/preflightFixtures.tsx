import type { Decorator } from '@storybook/react';

import { buildDeviceSelection, fakeDevices } from './callFixtures';
import { embeddedCapabilities } from './storyFixtures';
import { DeviceSelectionProvider } from '../devices/DeviceSelectionContext';
import type { PreviewMediaState } from '../preflight/PreviewMediaContext';
import { PreviewMediaContextProvider } from '../preflight/PreviewMediaContext';

export type PreviewMediaFixture = {
	capabilities?: PreviewMediaState['capabilities'];
	/** What the browser lists. */
	devices?: MediaDeviceInfo[];
	/** What the reader chose before; nothing, by default. */
	selectedIds?: Partial<Record<MediaDeviceKind, string>>;
};

/** The preflight's opened media, told rather than opened: no camera or microphone is asked for, and choosing logs. */
export const withPreviewMedia =
	({ capabilities = embeddedCapabilities, devices = fakeDevices, selectedIds = {} }: PreviewMediaFixture = {}): Decorator =>
	// eslint-disable-next-line react/display-name
	(Story) => (
		<PreviewMediaContextProvider value={{ capabilities, preview: { stream: null, devices } }}>
			<DeviceSelectionProvider value={buildDeviceSelection({ devices, selectedIds })}>
				<Story />
			</DeviceSelectionProvider>
		</PreviewMediaContextProvider>
	);
