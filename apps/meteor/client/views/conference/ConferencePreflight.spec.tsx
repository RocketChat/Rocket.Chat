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
			action='join'
			isDirect={false}
			canName={false}
			capabilities={bothDevices}
			onConfirm={onConfirm}
			onCancel={onCancel}
			{...props}
		/>,
		{ wrapper: mockAppRoot().withJohnDoe().withUserPreference('displayAvatars', true).build() },
	);

beforeEach(() => {
	onConfirm.mockClear();
	onCancel.mockClear();
	localStorage.clear();
});

it('says what this screen is for', async () => {
	renderPreflight();

	expect(await screen.findByText('Join_the_conference')).toBeInTheDocument();
});

// The whole point of waiting here: the choices are what the provider's URL is built from, so they have to reach
// the join rather than being applied afterwards.
it('confirms with the devices as they were left', async () => {
	renderPreflight();

	await userEvent.click(await screen.findByRole('button', { name: 'Mic_on' }));
	await userEvent.click(screen.getByRole('button', { name: 'Cam_off' }));
	await userEvent.click(screen.getByRole('button', { name: 'Join_call' }));

	expect(onConfirm).toHaveBeenCalledWith({ mic: false, cam: true }, 'general', true);
});

it('arrives muted and unseen unless told otherwise', async () => {
	renderPreflight();

	await userEvent.click(await screen.findByRole('button', { name: 'Join_call' }));

	expect(onConfirm).toHaveBeenCalledWith({ mic: true, cam: false }, 'general', true);
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

	expect(onConfirm).toHaveBeenCalledWith({ mic: true, cam: false }, 'general', true);
});

// This screen exists precisely because the user may not want the call after all, so leaving is a click away
// rather than a window they have to find the close button on.
it('can be walked away from', async () => {
	renderPreflight();

	await userEvent.click(await screen.findByRole('button', { name: 'Cancel' }));

	expect(onCancel).toHaveBeenCalled();
	expect(onConfirm).not.toHaveBeenCalled();
});

// The other half of what this screen is asking: not only how you will arrive, but who is already in there.
describe('who is already in the call', () => {
	const people = ['alice', 'bob', 'carol', 'dave', 'erin'].map((username) => ({ _id: username, username }));

	it('shows their faces when joining, under a label saying what they are', async () => {
		const { container } = renderPreflight({ action: 'join', participants: { people, total: 8 } });

		expect(await screen.findByText('People_in_the_call')).toBeInTheDocument();
		expect(container.querySelectorAll('img')).toHaveLength(5);
		// Followed by how many more there are, phrased as the call's message block phrases it.
		expect(screen.getByText('plus__usersCount__joined')).toBeInTheDocument();
	});

	// Nobody is in a call that hasn't started, so there is nothing to show and no space to leave for it.
	it('shows nothing when starting a call', async () => {
		renderPreflight({ action: 'start', participants: { people, total: 8 } });

		await screen.findByRole('button', { name: 'Start_call' });
		expect(screen.queryByText('People_in_the_call')).not.toBeInTheDocument();
		expect(screen.queryByTitle('__count__people_in_the_call')).not.toBeInTheDocument();
	});
});

describe('naming the call', () => {
	it('is not offered to everyone', async () => {
		renderPreflight();

		expect(await screen.findByText('Join_the_conference')).toBeInTheDocument();
		expect(screen.queryByLabelText('Call_name')).not.toBeInTheDocument();
	});

	it('starts from what the call is called today', async () => {
		renderPreflight({ canName: true });

		expect(await screen.findByLabelText('Call_name')).toHaveValue('general');
	});

	// A conference in a room is offered as the meeting it is, rather than as the room's bare name.
	it('offers the name it was given as a default', async () => {
		renderPreflight({ canName: true, defaultName: 'Meeting in "general"' });

		expect(await screen.findByLabelText('Call_name')).toHaveValue('Meeting in "general"');
	});

	it('hands the chosen name out with the devices', async () => {
		renderPreflight({ canName: true });

		await userEvent.clear(await screen.findByLabelText('Call_name'));
		await userEvent.type(screen.getByLabelText('Call_name'), 'Release planning');
		await userEvent.click(screen.getByRole('button', { name: 'Join_call' }));

		expect(onConfirm).toHaveBeenCalledWith({ mic: true, cam: false }, 'Release planning', true);
	});

	// Emptying the field is not asking for a nameless call — it falls back to what the call is called already.
	it('keeps the current name when the field is emptied', async () => {
		renderPreflight({ canName: true });

		await userEvent.clear(await screen.findByLabelText('Call_name'));
		await userEvent.click(screen.getByRole('button', { name: 'Join_call' }));

		expect(onConfirm).toHaveBeenCalledWith(expect.anything(), 'general', true);
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

// The screen says what this call is before anything else — with a person, or in a room; starting, or joining.
describe('what it says it is', () => {
	it('starts a conference in a room', async () => {
		renderPreflight({ action: 'start' });

		expect(await screen.findByText('Start_a_new_conference')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Start_call' })).toBeInTheDocument();
	});

	// Creating a direct call is not asking anyone to answer it: the caller lands here first, and confirming is what
	// rings the other side.
	it('starts a conference with a person, and says they will be told', async () => {
		renderPreflight({ action: 'start', isDirect: true, name: 'Alice Attali' });

		expect(await screen.findByText('Start_conference_with__name__')).toBeInTheDocument();
		expect(screen.getByText('__name__will_be_notified_when_you_start_the_call')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Call__name__' })).toBeInTheDocument();
	});

	it('joins a conference in a room', async () => {
		renderPreflight();

		expect(await screen.findByText('Join_the_conference')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Join_call' })).toBeInTheDocument();
		expect(screen.queryByText('__name__will_be_notified_when_you_start_the_call')).not.toBeInTheDocument();
	});

	it('joins a conference with a person', async () => {
		renderPreflight({ isDirect: true, name: 'Alice Attali' });

		expect(await screen.findByText('Join_conference_with__name__')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Join_call' })).toBeInTheDocument();
	});

	// The name is in the title, or in the field that changes it — saying it a third time under the tile was noise.
	it('does not repeat the name under the tile', async () => {
		renderPreflight({ name: 'general' });

		expect(await screen.findByText('Join_the_conference')).toBeInTheDocument();
		expect(screen.queryByText('general')).not.toBeInTheDocument();
	});
});

// Choosing a device is only offered where it can be honoured. A URL-based provider is told "camera on" and
// nothing more, so offering a camera to pick would be a promise this screen cannot keep.
describe('when the provider runs the call inside Rocket.Chat', () => {
	const embedded = { ...bothDevices, embedded: true };

	const mockDevices = (devices: Partial<MediaDeviceInfo>[]) => {
		const track = { stop: jest.fn(), kind: 'video' };
		Object.defineProperty(navigator, 'mediaDevices', {
			configurable: true,
			value: {
				getUserMedia: jest.fn().mockResolvedValue({ getTracks: () => [track] }),
				enumerateDevices: jest.fn().mockResolvedValue(devices),
			},
		});
	};

	it('offers the camera and microphone to choose from', async () => {
		mockDevices([
			{ kind: 'videoinput', deviceId: 'cam-1', label: 'Built-in camera' },
			{ kind: 'audioinput', deviceId: 'mic-1', label: 'Built-in microphone' },
		]);

		renderPreflight({ capabilities: embedded });

		expect(await screen.findByRole('button', { name: 'Camera' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Microphone' })).toBeInTheDocument();
	});

	// The chosen device is the client's business — the join endpoint takes only on/off, and rejects anything else.
	it('still confirms with only the on/off state', async () => {
		mockDevices([{ kind: 'videoinput', deviceId: 'cam-1', label: 'Built-in camera' }]);

		renderPreflight({ capabilities: embedded });

		await userEvent.click(await screen.findByRole('button', { name: 'Join_call' }));

		expect(onConfirm).toHaveBeenCalledWith({ mic: true, cam: false }, 'general', true);
	});
});

it('offers no device to choose when the provider could not be told which', async () => {
	renderPreflight();

	expect(await screen.findByRole('button', { name: 'Join_call' })).toBeInTheDocument();
	expect(screen.queryByRole('button', { name: 'Camera' })).not.toBeInTheDocument();
	expect(screen.queryByRole('button', { name: 'Microphone' })).not.toBeInTheDocument();
});

// Ringing is an interruption asked of someone else, so it is offered where the decision is made — but only where
// confirming is what creates the call, since a call that already exists was created with its answer.
describe('whether to ring the others', () => {
	it('rings by default, and says who will be told', async () => {
		renderPreflight({ action: 'start', isDirect: true, canChooseRinging: true });

		expect(await screen.findByRole('checkbox', { name: 'Ring_people' })).toBeChecked();
		expect(screen.getByText('__name__will_be_notified_when_you_start_the_call')).toBeInTheDocument();
	});

	it('confirms without ringing when it is turned off, and stops promising a notification', async () => {
		renderPreflight({ action: 'start', isDirect: true, canChooseRinging: true });

		await userEvent.click(await screen.findByRole('checkbox', { name: 'Ring_people' }));
		await userEvent.click(screen.getByRole('button', { name: 'Call__name__' }));

		expect(onConfirm).toHaveBeenCalledWith(expect.anything(), 'general', false);
		expect(screen.queryByText('__name__will_be_notified_when_you_start_the_call')).not.toBeInTheDocument();
	});

	// It is a habit rather than a per-call decision, so the next call starts where the last one left off.
	it('remembers the answer for the next call', async () => {
		const first = renderPreflight({ action: 'start', isDirect: true, canChooseRinging: true });

		await userEvent.click(await screen.findByRole('checkbox', { name: 'Ring_people' }));
		first.unmount();

		renderPreflight({ action: 'start', isDirect: true, canChooseRinging: true });

		expect(await screen.findByRole('checkbox', { name: 'Ring_people' })).not.toBeChecked();
	});

	// A switch wired to nothing is worse than no switch: a call in a channel is announced rather than rung, and a
	// call that already exists cannot change its mind here.
	it('offers nothing where ringing is not this screen to decide', async () => {
		renderPreflight({ action: 'start', isDirect: true });

		expect(await screen.findByText('__name__will_be_notified_when_you_start_the_call')).toBeInTheDocument();
		expect(screen.queryByRole('checkbox', { name: 'Ring_people' })).not.toBeInTheDocument();
	});
});
