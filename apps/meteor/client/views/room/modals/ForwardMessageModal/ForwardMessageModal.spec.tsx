import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ForwardMessageModal from './ForwardMessageModal';

jest.mock('../../../../components/UserAndRoomAutoCompleteMultiple', () => ({
	__esModule: true,
	default: ({ onChange }: { onChange: (val: string[]) => void }) => (
		<button type='button' data-testid='mock-select-room' onClick={() => onChange(['target-room-id'])}>
			Select Room
		</button>
	),
}));

jest.mock('../../../../lib/utils/prependReplies', () => ({
	prependReplies: jest.fn((_text, [msg]) => Promise.resolve(`[ ](http://link/${msg._id})`)),
}));

const postMessageEndpointMock = jest.fn();

const appRoot = mockAppRoot()
	.withEndpoint('POST', '/v1/chat.postMessage', postMessageEndpointMock)
	.withTranslations('en', 'core', {
		Forward_message: 'Forward message',
		Person_Or_Channel: 'Person or channel',
		Forward: 'Forward',
		Copy_Link: 'Copy link',
		Copied: 'Copied',
		Close: 'Close',
		Message_has_been_forwarded: 'Message has been forwarded',
		__count__messages_forwarded: '{{count}} messages forwarded',
	})
	.build();

const createMockMessage = (id: string, text: string, timeOffset = 0) =>
	({
		_id: id,
		rid: 'general',
		msg: text,
		ts: new Date(1700000000000 + timeOffset),
		u: { _id: `u-${id}`, username: `user-${id}`, name: `User ${id}` },
		md: [{ type: 'PARAGRAPH', value: [{ type: 'PLAIN_TEXT', value: text }] }],
	}) as any;

describe('ForwardMessageModal', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		postMessageEndpointMock.mockResolvedValue({ success: true });
	});

	it('should render preview for multiple selected messages', () => {
		const msg1 = createMockMessage('m1', 'First message', 1000);
		const msg2 = createMockMessage('m2', 'Second message', 2000);

		render(<ForwardMessageModal messages={[msg1, msg2]} onClose={jest.fn()} />, {
			wrapper: appRoot,
		});

		expect(screen.getByText('Forward message')).toBeInTheDocument();
		expect(screen.getByText('First message')).toBeInTheDocument();
		expect(screen.getByText('Second message')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Forward' })).toBeDisabled();
	});

	it('should submit forwarded messages sequentially when recipient is selected', async () => {
		const msg1 = createMockMessage('m1', 'First message', 1000);
		const msg2 = createMockMessage('m2', 'Second message', 2000);
		const onClose = jest.fn();

		render(<ForwardMessageModal messages={[msg1, msg2]} onClose={onClose} />, {
			wrapper: appRoot,
		});

		const selectRoomBtn = screen.getByTestId('mock-select-room');
		await userEvent.click(selectRoomBtn);

		const forwardButton = screen.getByRole('button', { name: 'Forward' });
		await waitFor(() => {
			expect(forwardButton).not.toBeDisabled();
		});

		await userEvent.click(forwardButton);

		await waitFor(() => {
			expect(postMessageEndpointMock).toHaveBeenCalledTimes(2);
		});

		expect(onClose).toHaveBeenCalled();
	});

	it('should support backwards compatibility for single message prop', () => {
		const singleMsg = createMockMessage('m-single', 'Single message content');

		render(<ForwardMessageModal message={singleMsg} permalink='https://link.com' onClose={jest.fn()} />, {
			wrapper: appRoot,
		});

		expect(screen.getByText('Single message content')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Copy link' })).toBeInTheDocument();
	});

	it('should keep modal open showing only failed messages on partial failure', async () => {
		const msg1 = createMockMessage('m1', 'First message', 1000);
		const msg2 = createMockMessage('m2', 'Second message', 2000);
		const onClose = jest.fn();

		postMessageEndpointMock.mockResolvedValueOnce({ success: true }).mockRejectedValueOnce(new Error('Network error'));

		render(<ForwardMessageModal messages={[msg1, msg2]} onClose={onClose} />, {
			wrapper: appRoot,
		});

		const selectRoomBtn = screen.getByTestId('mock-select-room');
		await userEvent.click(selectRoomBtn);

		const forwardButton = screen.getByRole('button', { name: 'Forward' });
		await waitFor(() => {
			expect(forwardButton).not.toBeDisabled();
		});

		await userEvent.click(forwardButton);

		await waitFor(() => {
			expect(postMessageEndpointMock).toHaveBeenCalledTimes(2);
		});

		expect(onClose).not.toHaveBeenCalled();
		expect(screen.queryByText('First message')).not.toBeInTheDocument();
		expect(screen.getByText('Second message')).toBeInTheDocument();
	});
});
