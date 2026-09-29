import type { VideoConferenceCapabilities } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';

import ConferencePreflight from './ConferencePreflight';
import type { PreflightMedia } from '../context/definitions';

const renderPreflight = (capabilities: VideoConferenceCapabilities) => {
	const opened = jest.fn();
	const Provider = ({ children }: { capabilities: VideoConferenceCapabilities; children: ReactNode }) => {
		opened();
		return (
			<div role='region' aria-label='media provider'>
				{children}
			</div>
		);
	};
	const media: PreflightMedia = {
		Provider,
		Preview: () => <div role='img' aria-label='camera preview' />,
		Devices: () => <div role='group' aria-label='device choices' />,
	};

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
it('hands the preview and the device choices to the application for a provider that runs the call in here', () => {
	const { opened } = renderPreflight({ mic: true, cam: true, embedded: true });

	expect(opened).toHaveBeenCalled();
	expect(screen.getByRole('region', { name: 'media provider' })).toContainElement(screen.getByRole('group', { name: 'device choices' }));
	expect(screen.getByRole('img', { name: 'camera preview' })).toBeInTheDocument();
});

// A provider at an address of its own takes "camera on" but not which camera, so showing one would promise a
// choice this screen cannot make — and opening the devices would ask for a permission nothing uses.
it('opens no devices for a provider at an address of its own', () => {
	const { opened } = renderPreflight({ mic: true, cam: true });

	expect(opened).not.toHaveBeenCalled();
	expect(screen.queryByRole('group', { name: 'device choices' })).not.toBeInTheDocument();
	expect(screen.queryByRole('img', { name: 'camera preview' })).not.toBeInTheDocument();
});
