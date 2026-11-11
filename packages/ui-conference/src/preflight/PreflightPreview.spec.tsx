import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import PreflightPreview from './PreflightPreview';
import { PreviewMediaContextProvider } from './PreviewMediaContext';
import type { PreviewVideo } from '../call/previewVideo';
import { PreviewVideoContext } from '../call/previewVideo';
import { embeddedCapabilities } from '../fixtures/storyFixtures';
import { callPreferencesStorageKey } from '../hooks/useCallDevicesInitialState';

const preferencesKey = callPreferencesStorageKey('john.doe');

const renderPreview = (previewVideo: PreviewVideo) =>
	render(
		<PreviewMediaContextProvider value={{ capabilities: embeddedCapabilities, preview: { stream: null, devices: [] } }}>
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

it('says nothing about the camera while it opens or works', () => {
	renderPreview({ error: false });

	expect(screen.queryByText('Could_not_access_your_camera')).not.toBeInTheDocument();
});

it('says so when the camera could not be opened', () => {
	renderPreview({ error: true });

	expect(screen.getByText('Could_not_access_your_camera')).toBeInTheDocument();
});
