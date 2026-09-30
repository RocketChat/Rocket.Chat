import type { Decorator } from '@storybook/react';

import { fakeDevices } from './callFixtures';
import { embeddedCapabilities } from './storyFixtures';
import type { PreviewMediaState } from '../preflight/PreviewMediaContext';
import { PreviewMediaContextProvider } from '../preflight/PreviewMediaContext';

const ofKind = (devices: MediaDeviceInfo[], kind: MediaDeviceKind) => devices.filter((device) => device.kind === kind);

export type PreviewMediaFixture = {
	capabilities?: PreviewMediaState['capabilities'];
	/** What the browser lists; the preview's own lists are split out of it. */
	devices?: MediaDeviceInfo[];
};

/** The preflight's opened media, told rather than opened: no camera or microphone is asked for. */
export const withPreviewMedia =
	({ capabilities = embeddedCapabilities, devices = fakeDevices }: PreviewMediaFixture = {}): Decorator =>
	// eslint-disable-next-line react/display-name
	(Story) => (
		<PreviewMediaContextProvider
			value={{
				capabilities,
				preview: {
					stream: null,
					error: false,
					videoInputs: ofKind(devices, 'videoinput'),
					audioInputs: ofKind(devices, 'audioinput'),
					audioOutputs: ofKind(devices, 'audiooutput'),
				},
			}}
		>
			<Story />
		</PreviewMediaContextProvider>
	);
