import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ConferencePreflight from './ConferencePreflight';

const onJoin = jest.fn();
const rename = jest.fn(() => ({ success: true }) as any);

const bothDevices = { mic: true, cam: true };

const renderPreflight = (props: Partial<Parameters<typeof ConferencePreflight>[0]> = {}) =>
	render(
		<ConferencePreflight
			callId='call-id'
			name='general'
			canRename={false}
			placing={false}
			capabilities={bothDevices}
			onJoin={onJoin}
			{...props}
		/>,
		{
			wrapper: mockAppRoot().withJohnDoe().withEndpoint('POST', '/v1/video-conference.rename', rename).build(),
		},
	);

beforeEach(() => {
	onJoin.mockClear();
	rename.mockClear();
	localStorage.clear();
});

it('shows what the call is called', async () => {
	renderPreflight();

	expect(await screen.findByText('general')).toBeInTheDocument();
});

// The whole point of waiting here: the choices are what the provider's URL is built from, so they have to reach
// the join rather than being applied afterwards.
it('joins with the devices as they were left', async () => {
	renderPreflight();

	await userEvent.click(await screen.findByRole('button', { name: 'Mic_on' }));
	await userEvent.click(screen.getByRole('button', { name: 'Cam_off' }));
	await userEvent.click(screen.getByRole('button', { name: 'Join_call' }));

	expect(onJoin).toHaveBeenCalledWith({ mic: false, cam: true });
});

it('arrives muted and unseen unless told otherwise', async () => {
	renderPreflight();

	await userEvent.click(await screen.findByRole('button', { name: 'Join_call' }));

	expect(onJoin).toHaveBeenCalledWith({ mic: true, cam: false });
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

	expect(onJoin).toHaveBeenCalledWith({ mic: true, cam: false });
});

describe('naming the call', () => {
	it('is not offered to everyone', async () => {
		renderPreflight();

		expect(await screen.findByText('general')).toBeInTheDocument();
		expect(screen.queryByLabelText('Call_name')).not.toBeInTheDocument();
	});

	it('starts from what the call is called today', async () => {
		renderPreflight({ canRename: true });

		expect(await screen.findByLabelText('Call_name')).toHaveValue('general');
	});

	it('names the call before joining it', async () => {
		renderPreflight({ canRename: true });

		await userEvent.clear(await screen.findByLabelText('Call_name'));
		await userEvent.type(screen.getByLabelText('Call_name'), 'Release planning');
		await userEvent.click(screen.getByRole('button', { name: 'Join_call' }));

		await waitFor(() => expect(rename).toHaveBeenCalledWith({ callId: 'call-id', title: 'Release planning' }));
		expect(onJoin).toHaveBeenCalled();
	});

	it('says nothing to the server when the name was left alone', async () => {
		renderPreflight({ canRename: true });

		await userEvent.click(await screen.findByRole('button', { name: 'Join_call' }));

		expect(rename).not.toHaveBeenCalled();
		expect(onJoin).toHaveBeenCalled();
	});

	// Naming is not worth failing the join over — the call is what they actually asked for.
	it('joins anyway when the name would not take', async () => {
		rename.mockImplementationOnce(() => {
			throw new Error('error-not-allowed');
		});
		renderPreflight({ canRename: true });

		await userEvent.clear(await screen.findByLabelText('Call_name'));
		await userEvent.type(screen.getByLabelText('Call_name'), 'Release planning');
		await userEvent.click(screen.getByRole('button', { name: 'Join_call' }));

		await waitFor(() => expect(onJoin).toHaveBeenCalled());
	});
});

// Creating a direct call is not asking anyone to answer it: the caller lands here first, and going in is what
// rings the other side. The screen says so, and the button is the call rather than a join.
describe('placing the call', () => {
	it('says the other side has not been called yet', async () => {
		renderPreflight({ placing: true, name: 'Alice Attali' });

		expect(await screen.findByText('__name__will_be_notified_when_you_start_the_call')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Call__name__' })).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Join_call' })).not.toBeInTheDocument();
	});

	it('offers a plain join for a call that is already under way', async () => {
		renderPreflight({ name: 'Alice Attali' });

		expect(await screen.findByRole('button', { name: 'Join_call' })).toBeInTheDocument();
		expect(screen.queryByText('__name__will_be_notified_when_you_start_the_call')).not.toBeInTheDocument();
	});
});
