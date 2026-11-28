import { DeviceSelectionProvider } from '@rocket.chat/ui-media';
import type { Decorator } from '@storybook/react';

import { buildDeviceSelection, buildNoiseSuppression, buildVideoQuality, fakeDevices } from './callFixtures.js';
import { embeddedCapabilities } from './storyFixtures.js';
import { NoiseSuppressionProvider } from '../devices/NoiseSuppressionContext.js';
import { VideoQualityProvider } from '../devices/VideoQualityContext.js';
import type { PreviewMediaState } from '../preflight/PreviewMediaContext.js';
import { PreviewMediaContextProvider } from '../preflight/PreviewMediaContext.js';

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
	// oxlint-disable-next-line react/display-name
	(Story) => (
		<PreviewMediaContextProvider value={{ capabilities, preview: { stream: null, devices } }}>
			<DeviceSelectionProvider value={buildDeviceSelection({ devices, selectedIds })}>
				<VideoQualityProvider value={buildVideoQuality({ height: undefined })}>
					<NoiseSuppressionProvider value={buildNoiseSuppression()}>
						<Story />
					</NoiseSuppressionProvider>
				</VideoQualityProvider>
			</DeviceSelectionProvider>
		</PreviewMediaContextProvider>
	);
