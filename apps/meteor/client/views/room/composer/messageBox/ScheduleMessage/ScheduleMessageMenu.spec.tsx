import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ScheduleMessageMenu from './ScheduleMessageMenu';
import FakeRoomProvider from '../../../../../../tests/mocks/client/FakeRoomProvider';
import type { ComposerAPI } from '../../../../../lib/chats/ChatAPI';

const now = new Date(2026, 9, 21, 15, 30);
const tomorrowAtNine = new Date(2026, 9, 22, 9, 0);

const createScheduledMessage = jest.fn();

const appRoot = ({ enabled = true, encrypted = false, t = 'c' as 'c' | 'l' } = {}) =>
	mockAppRoot()
		.withJohnDoe()
		.withTranslations('en', 'core', {
			Schedule_message: 'Schedule message',
			Schedule_tomorrow: 'Tomorrow, {{time}}',
			Schedule_custom: 'Custom…',
		})
		.withSetting('Message_Scheduling_Enabled', enabled)
		.withPermission('schedule-message')
		.withEndpoint('POST', '/v1/scheduledMessages.create', (params) => createScheduledMessage(params))
		.wrap((children) => <FakeRoomProvider roomOverrides={{ _id: 'rid', encrypted, t }}>{children}</FakeRoomProvider>)
		.build();

const store = <T,>(value: T) => ({ get: () => value, subscribe: () => () => undefined, clear: jest.fn() });

const composerWith = (text: string, { uploads = [] as unknown[], quotes = [] as unknown[] } = {}) =>
	({ text, clear: jest.fn(), uploads: store(uploads), quotedMessages: store(quotes) }) as unknown as ComposerAPI & { clear: jest.Mock };

const scheduleTomorrow = async () => {
	const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
	await user.click(screen.getByRole('button', { name: 'Schedule message' }));
	await user.click(await screen.findByRole('menuitem', { name: /Tomorrow/ }));
};

describe('ScheduleMessageMenu', () => {
	beforeEach(() => {
		jest.useFakeTimers({ advanceTimers: true }).setSystemTime(now);
		createScheduledMessage.mockReset().mockResolvedValue({ scheduledMessage: { _id: 's1', scheduledAt: tomorrowAtNine.toISOString() } });
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it('renders nothing when scheduling is turned off', () => {
		render(<ScheduleMessageMenu rid='rid' composer={composerWith('hello')} disabled={false} />, { wrapper: appRoot({ enabled: false }) });

		expect(screen.queryByRole('button', { name: 'Schedule message' })).not.toBeInTheDocument();
	});

	it('renders nothing in an encrypted room', () => {
		render(<ScheduleMessageMenu rid='rid' composer={composerWith('hello')} disabled={false} />, { wrapper: appRoot({ encrypted: true }) });

		expect(screen.queryByRole('button', { name: 'Schedule message' })).not.toBeInTheDocument();
	});

	it('renders nothing in an omnichannel room', () => {
		render(<ScheduleMessageMenu rid='rid' composer={composerWith('hello')} disabled={false} />, { wrapper: appRoot({ t: 'l' }) });

		expect(screen.queryByRole('button', { name: 'Schedule message' })).not.toBeInTheDocument();
	});

	it('is disabled while the composer holds a quoted message, which scheduling would drop', () => {
		render(<ScheduleMessageMenu rid='rid' composer={composerWith('hello', { quotes: [{ _id: 'q1' }] })} disabled={false} />, {
			wrapper: appRoot(),
		});

		expect(screen.getByRole('button', { name: 'Schedule message' })).toBeDisabled();
	});

	it('schedules the attached files with the text, and clears them from the composer', async () => {
		const composer = composerWith('see attached', {
			uploads: [
				{ id: 'f1', url: '/file', file: { name: 'a.png' }, altText: 'a cat' },
				{ id: 'f2', file: { name: 'b.png' }, error: new Error('upload failed') },
			],
		});
		render(<ScheduleMessageMenu rid='rid' composer={composer} disabled={false} />, { wrapper: appRoot() });

		await scheduleTomorrow();

		expect(createScheduledMessage).toHaveBeenCalledWith(
			expect.objectContaining({ msg: 'see attached', files: [{ _id: 'f1', name: 'a.png', description: 'a cat' }] }),
		);
		expect((composer.uploads as unknown as { clear: jest.Mock }).clear).toHaveBeenCalled();
	});

	it('keeps text typed while the request was running', async () => {
		const composer = composerWith('hello');
		createScheduledMessage.mockImplementation(async () => {
			Object.assign(composer, { text: 'hello and more' });
			return { scheduledMessage: { _id: 's1', scheduledAt: tomorrowAtNine.toISOString() } };
		});
		render(<ScheduleMessageMenu rid='rid' composer={composer} disabled={false} />, { wrapper: appRoot() });

		await scheduleTomorrow();

		expect(createScheduledMessage).toHaveBeenCalledWith(expect.objectContaining({ msg: 'hello' }));
		expect(composer.clear).not.toHaveBeenCalled();
	});

	it('is disabled while a request is running, so one click schedules once', async () => {
		createScheduledMessage.mockReturnValue(new Promise(() => undefined));
		render(<ScheduleMessageMenu rid='rid' composer={composerWith('hello')} disabled={false} />, { wrapper: appRoot() });

		await scheduleTomorrow();

		expect(await screen.findByRole('button', { name: 'Schedule message' })).toBeDisabled();
	});

	it('shows the send time of each preset', async () => {
		render(<ScheduleMessageMenu rid='rid' composer={composerWith('hello')} disabled={false} />, { wrapper: appRoot() });

		await userEvent.setup({ advanceTimers: jest.advanceTimersByTime }).click(screen.getByRole('button', { name: 'Schedule message' }));

		expect(await screen.findByRole('menuitem', { name: /^Tomorrow, [^{}]+$/ })).toBeInTheDocument();
	});

	it('names the menu and offers a custom date and time', async () => {
		render(<ScheduleMessageMenu rid='rid' composer={composerWith('hello')} disabled={false} />, { wrapper: appRoot() });

		await userEvent.setup({ advanceTimers: jest.advanceTimersByTime }).click(screen.getByRole('button', { name: 'Schedule message' }));

		expect(within(await screen.findByRole('menu')).getByText('Schedule message')).toBeInTheDocument();
		expect(screen.getByRole('menuitem', { name: 'Custom…' })).toBeInTheDocument();
	});

	it('schedules the composer text for tomorrow at 9:00 and clears the composer', async () => {
		const composer = composerWith(' hello ');
		render(<ScheduleMessageMenu rid='rid' tmid='parent' composer={composer} disabled={false} />, { wrapper: appRoot() });

		await scheduleTomorrow();

		expect(createScheduledMessage).toHaveBeenCalledWith({
			rid: 'rid',
			msg: 'hello',
			tmid: 'parent',
			scheduledAt: tomorrowAtNine.toISOString(),
		});
		expect(composer.clear).toHaveBeenCalledTimes(1);
	});

	it('keeps "Also send to channel" for a thread reply', async () => {
		render(<ScheduleMessageMenu rid='rid' tmid='parent' tshow composer={composerWith('hello')} disabled={false} />, { wrapper: appRoot() });

		await scheduleTomorrow();

		expect(createScheduledMessage).toHaveBeenCalledWith(expect.objectContaining({ tmid: 'parent', tshow: true }));
	});

	it('does not schedule a slash command', async () => {
		const composer = composerWith('/invite @ana');
		render(<ScheduleMessageMenu rid='rid' composer={composer} disabled={false} />, { wrapper: appRoot() });

		await scheduleTomorrow();

		expect(createScheduledMessage).not.toHaveBeenCalled();
		expect(composer.clear).not.toHaveBeenCalled();
	});

	it('keeps the composer text when the server refuses', async () => {
		createScheduledMessage.mockRejectedValue(new Error('error-scheduled-messages-limit-reached'));
		const composer = composerWith('hello');
		render(<ScheduleMessageMenu rid='rid' composer={composer} disabled={false} />, { wrapper: appRoot() });

		await scheduleTomorrow();

		expect(createScheduledMessage).toHaveBeenCalled();
		expect(composer.clear).not.toHaveBeenCalled();
	});
});
