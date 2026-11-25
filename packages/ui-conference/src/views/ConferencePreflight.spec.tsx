import type { VideoConferenceCapabilities } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { axe } from 'jest-axe';

import ConferencePreflight from './ConferencePreflight.js';
import * as stories from './ConferencePreflight.stories.js';
import type { PreviewVideoProviderProps } from '../call/previewVideo.js';
import type { PreflightMedia } from '../context/definitions.js';
import { callPreferencesStorageKey } from '../hooks/useCallDevicesInitialState.js';

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

describe('a name that is shown but not editable', () => {
	const renderNamed = ({ canName, nameReadOnly }: { canName: boolean; nameReadOnly?: boolean }) => {
		const onConfirm = jest.fn();

		render(
			<ConferencePreflight
				name='Weekly sync'
				action='start'
				isDirect={false}
				canName={canName}
				nameReadOnly={nameReadOnly}
				capabilities={{ mic: true, cam: true }}
				media={null}
				onConfirm={onConfirm}
				onCancel={jest.fn()}
			/>,
			{ wrapper: mockAppRoot().withJohnDoe().build() },
		);

		return { onConfirm };
	};

	// A conference link starts under its own name: the reader sees which conference it is, and cannot rename it.
	it('shows a name that cannot be changed', async () => {
		renderNamed({ canName: false, nameReadOnly: true });

		const field = screen.getByLabelText('Call_name');
		expect(field).toHaveValue('Weekly sync');
		expect(field).toHaveAttribute('readonly');

		await userEvent.type(field, ' renamed');
		expect(field).toHaveValue('Weekly sync');
	});

	it('shows no name field when the name is neither editable nor shown', () => {
		renderNamed({ canName: false });

		expect(screen.queryByLabelText('Call_name')).not.toBeInTheDocument();
	});

	it('confirms with the name it shows', async () => {
		const { onConfirm } = renderNamed({ canName: false, nameReadOnly: true });

		await userEvent.click(screen.getByRole('button', { name: 'Start_call' }));

		expect(onConfirm).toHaveBeenCalledWith(expect.anything(), 'Weekly sync', expect.any(Boolean));
	});

	// Being allowed to name the call wins: the field stays editable.
	it('keeps the name editable for someone who may name the call', async () => {
		renderNamed({ canName: true, nameReadOnly: true });

		const field = screen.getByLabelText('Call_name');
		expect(field).not.toHaveAttribute('readonly');

		await userEvent.clear(field);
		await userEvent.type(field, 'Retro');
		expect(field).toHaveValue('Retro');
	});
});

describe('stories', () => {
	const { NameReadOnly, MobilePortraitNameReadOnly } = composeStories(stories);

	test.each([
		['NameReadOnly', NameReadOnly],
		['MobilePortraitNameReadOnly', MobilePortraitNameReadOnly],
	] as const)('%s should have no a11y violations', async (_storyname, Story) => {
		const { baseElement } = render(<Story />);

		// `region` off: the screen is rendered on its own here; in the product the conference window is the whole page.
		const results = await axe(baseElement, { rules: { region: { enabled: false } } });
		expect(results).toHaveNoViolations();
	});
});
