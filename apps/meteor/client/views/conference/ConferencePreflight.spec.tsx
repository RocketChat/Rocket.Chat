import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ConferencePreflight from './ConferencePreflight';

const onConfirm = jest.fn();
const onCancel = jest.fn();

const bothDevices = { mic: true, cam: true };

const renderPreflight = (props: Partial<Parameters<typeof ConferencePreflight>[0]> = {}) =>
	render(
		<ConferencePreflight
			name='general'
			confirm='join'
			canName={false}
			capabilities={bothDevices}
			onConfirm={onConfirm}
			onCancel={onCancel}
			{...props}
		/>,
		{ wrapper: mockAppRoot().withJohnDoe().build() },
	);

beforeEach(() => {
	onConfirm.mockClear();
	onCancel.mockClear();
	localStorage.clear();
});

it('shows what the call is called', async () => {
	renderPreflight();

	expect(await screen.findByText('general')).toBeInTheDocument();
});

// The whole point of waiting here: the choices are what the provider's URL is built from, so they have to reach
// the join rather than being applied afterwards.
it('confirms with the devices as they were left', async () => {
	renderPreflight();

	await userEvent.click(await screen.findByRole('button', { name: 'Mic_on' }));
	await userEvent.click(screen.getByRole('button', { name: 'Cam_off' }));
	await userEvent.click(screen.getByRole('button', { name: 'Join_call' }));

	expect(onConfirm).toHaveBeenCalledWith({ mic: false, cam: true }, 'general');
});

it('arrives muted and unseen unless told otherwise', async () => {
	renderPreflight();

	await userEvent.click(await screen.findByRole('button', { name: 'Join_call' }));

	expect(onConfirm).toHaveBeenCalledWith({ mic: true, cam: false }, 'general');
});

// A device the provider can't be told about is not something to offer a switch for.
it('offers only the devices the provider takes', async () => {
	renderPreflight({ capabilities: { mic: true } });

	expect(await screen.findByRole('button', { name: 'Mic_on' })).toBeInTheDocument();
	expect(screen.queryByRole('button', { name: 'Cam_off' })).not.toBeInTheDocument();
});

it('reports a device the provider cannot be told about as off', async () => {
	renderPreflight({ capabilities: { mic: true } });

	await userEvent.click(await screen.findByRole('button', { name: 'Join_call' }));

	expect(onConfirm).toHaveBeenCalledWith({ mic: true, cam: false }, 'general');
});

// This screen exists precisely because the user may not want the call after all, so leaving is a click away
// rather than a window they have to find the close button on.
it('can be walked away from', async () => {
	renderPreflight();

	await userEvent.click(await screen.findByRole('button', { name: 'Cancel' }));

	expect(onCancel).toHaveBeenCalled();
	expect(onConfirm).not.toHaveBeenCalled();
});

describe('naming the call', () => {
	it('is not offered to everyone', async () => {
		renderPreflight();

		expect(await screen.findByText('general')).toBeInTheDocument();
		expect(screen.queryByLabelText('Call_name')).not.toBeInTheDocument();
	});

	it('starts from what the call is called today', async () => {
		renderPreflight({ canName: true });

		expect(await screen.findByLabelText('Call_name')).toHaveValue('general');
	});

	it('hands the chosen name out with the devices', async () => {
		renderPreflight({ canName: true });

		await userEvent.clear(await screen.findByLabelText('Call_name'));
		await userEvent.type(screen.getByLabelText('Call_name'), 'Release planning');
		await userEvent.click(screen.getByRole('button', { name: 'Join_call' }));

		expect(onConfirm).toHaveBeenCalledWith({ mic: true, cam: false }, 'Release planning');
	});

	// Emptying the field is not asking for a nameless call — it falls back to what the call is called already.
	it('keeps the current name when the field is emptied', async () => {
		renderPreflight({ canName: true });

		await userEvent.clear(await screen.findByLabelText('Call_name'));
		await userEvent.click(screen.getByRole('button', { name: 'Join_call' }));

		expect(onConfirm).toHaveBeenCalledWith(expect.anything(), 'general');
	});
});

// No self-view: all a provider can be told is whether to start with the camera on, not which camera, so a preview
// would promise a choice this screen cannot make. It says what will happen instead.
describe('the camera', () => {
	it('says it is off, when it is', async () => {
		renderPreflight();

		expect(await screen.findByText('Your_camera_is_turned_off')).toBeInTheDocument();
	});

	it('says it will be on, and where the devices are chosen', async () => {
		renderPreflight();

		await userEvent.click(await screen.findByRole('button', { name: 'Cam_off' }));

		expect(screen.getByText('Your_camera_will_be_on')).toBeInTheDocument();
		expect(screen.getByText('Which_devices_are_used_is_chosen_in_the_call')).toBeInTheDocument();
		expect(screen.queryByText('Your_camera_is_turned_off')).not.toBeInTheDocument();
	});

	it('shows no preview of it either way', async () => {
		const { container } = renderPreflight();

		expect(await screen.findByText('Your_camera_is_turned_off')).toBeInTheDocument();
		expect(container.querySelector('video')).toBeNull();

		await userEvent.click(screen.getByRole('button', { name: 'Cam_off' }));

		expect(container.querySelector('video')).toBeNull();
	});
});

// Creating a direct call is not asking anyone to answer it: the caller lands here first, and confirming is what
// rings the other side. The screen says so, and the button is the call rather than a join.
describe('what confirming does', () => {
	it('calls the person, when that is what it is', async () => {
		renderPreflight({ confirm: 'call', name: 'Alice Attali' });

		expect(await screen.findByText('__name__will_be_notified_when_you_start_the_call')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Call__name__' })).toBeInTheDocument();
	});

	it('starts a conference that does not exist yet', async () => {
		renderPreflight({ confirm: 'start' });

		expect(await screen.findByRole('button', { name: 'Start_call' })).toBeInTheDocument();
		expect(screen.queryByText('__name__will_be_notified_when_you_start_the_call')).not.toBeInTheDocument();
	});

	it('joins one that is already under way', async () => {
		renderPreflight();

		expect(await screen.findByRole('button', { name: 'Join_call' })).toBeInTheDocument();
		expect(screen.queryByText('__name__will_be_notified_when_you_start_the_call')).not.toBeInTheDocument();
	});
});
