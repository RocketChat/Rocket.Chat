import type { VideoConferenceCapabilities } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import ConferencePreflight from './ConferencePreflight';
import type { PreviewVideoProviderProps } from '../call/previewVideo';
import type { PreflightMedia } from '../context/definitions';
import { callPreferencesStorageKey } from '../hooks/useCallDevicesInitialState';

const preferencesKey = callPreferencesStorageKey('john.doe');

afterEach(() => {
	localStorage.removeItem(preferencesKey);
});

const renderPreflight = (capabilities: VideoConferenceCapabilities) => {
	const opened = jest.fn();
	const PreviewVideoProvider = ({ enabled, children }: PreviewVideoProviderProps) => {
		opened({ enabled });
		return (
			<div role='region' aria-label='camera provider'>
				{children}
			</div>
		);
	};
	const media: PreflightMedia = { PreviewVideoProvider };

	render(
		<ConferencePreflight
			name='Weekly sync'
			action='join'
			isDirect={false}
			canName={false}
			capabilities={capabilities}
			media={media}
			onConfirm={jest.fn()}
			onCancel={jest.fn()}
		/>,
		{ wrapper: mockAppRoot().withJohnDoe().build() },
	);

	return { opened };
};

// Only a provider that runs the call in here can be told which devices to use, so only there does the preflight
// open the reader's camera and microphone — and around the preview, so both halves share the one pair.
it("opens the application's camera around the preview and the device choices for a provider that runs the call in here", () => {
	localStorage.setItem(preferencesKey, JSON.stringify({ mic: true, cam: true, ring: true }));
	const { opened } = renderPreflight({ mic: true, cam: true, embedded: true });

	expect(opened).toHaveBeenCalledWith({ enabled: true });
	expect(screen.getByRole('region', { name: 'camera provider' })).toContainElement(screen.getByRole('button', { name: /^Speaker/ }));
});

// A provider at an address of its own takes "camera on" but not which camera, so showing one would promise a
// choice this screen cannot make — and opening the devices would ask for a permission nothing uses.
it('opens no devices for a provider at an address of its own', () => {
	const { opened } = renderPreflight({ mic: true, cam: true });

	expect(opened).not.toHaveBeenCalled();
	expect(screen.queryByRole('button', { name: /^Speaker/ })).not.toBeInTheDocument();
});
