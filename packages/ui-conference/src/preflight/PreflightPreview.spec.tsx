import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import PreflightPreview from './PreflightPreview';
import { PreviewMediaContextProvider } from './PreviewMediaContext';
import type { PreviewVideo } from '../call/previewVideo';
import { PreviewVideoContext } from '../call/previewVideo';
import { embeddedCapabilities } from '../fixtures/storyFixtures';
import { callPreferencesStorageKey } from '../hooks/useCallDevicesInitialState';

const preferencesKey = callPreferencesStorageKey('john.doe');

const renderPreview = ({ micFailed, previewVideo }: { micFailed: boolean; previewVideo: PreviewVideo }) =>
	render(
		<PreviewMediaContextProvider value={{ capabilities: embeddedCapabilities, preview: { stream: null, error: micFailed, devices: [] } }}>
			<PreviewVideoContext.Provider value={previewVideo}>
				<PreflightPreview />
			</PreviewVideoContext.Provider>
		</PreviewMediaContextProvider>,
		{ wrapper: mockAppRoot().withJohnDoe().build() },
	);

beforeEach(() => {
	localStorage.setItem(preferencesKey, JSON.stringify({ mic: true, cam: true }));
});

afterEach(() => {
	localStorage.removeItem(preferencesKey);
});

// The microphone failing says nothing about the camera, which may still be opening or already working.
it('does not blame the camera for the microphone', () => {
	renderPreview({ micFailed: true, previewVideo: { error: false } });

	expect(screen.queryByText('Could_not_access_your_camera')).not.toBeInTheDocument();
});

it('says so when the camera could not be opened', () => {
	renderPreview({ micFailed: false, previewVideo: { error: true } });

	expect(screen.getByText('Could_not_access_your_camera')).toBeInTheDocument();
});
