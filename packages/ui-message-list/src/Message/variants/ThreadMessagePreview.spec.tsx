import type { IMessage, IThreadMessage } from '@rocket.chat/core-typings';
import { createFakeMessage, mockAppRoot } from '@rocket.chat/mock-providers';
import { composeStories } from '@storybook/react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';

import ThreadMessagePreview from './ThreadMessagePreview';
import * as stories from './ThreadMessagePreview.stories';
import { mockMessageProviders } from '../../../tests/utils/mockMessageProviders';
import { createMessageSelectionStore } from '../contexts/MessageSelectionContext';

const parent = createFakeMessage({ _id: 'main', rid: 'room', msg: 'the thread' });
const reply = createFakeMessage<IThreadMessage>({
	_id: 'reply',
	rid: 'room',
	tmid: 'main',
	msg: 'a reply',
	u: { _id: 'bob', username: 'bob', name: 'Bob' },
});
const parentQuery = (data: IMessage | undefined, status: { isLoading?: boolean; isError?: boolean } = {}) => ({
	useParentMessage: () => ({ data, isLoading: false, isError: false, ...status }),
});
const relatedData = parentQuery(parent);

describe('the row', () => {
	it('renders a focusable link with its role description (R5)', () => {
		render(<ThreadMessagePreview message={reply} sequential={false} />, { wrapper: mockMessageProviders({ relatedData }).wrapper });

		const link = screen.getByRole('link');
		expect(link).toHaveAttribute('tabindex', '0');
		expect(link).toHaveAttribute('aria-roledescription', 'thread_message_preview');
	});

	it('passes the other props to its root (R6)', () => {
		render(<ThreadMessagePreview message={reply} sequential={false} data-tmid='main' data-mid='reply' />, {
			wrapper: mockMessageProviders({ relatedData }).wrapper,
		});

		expect(screen.getByRole('link')).toHaveAttribute('data-tmid', 'main');
		expect(screen.getByRole('link')).toHaveAttribute('data-mid', 'reply');
	});

	it('leaves out the origin row when sequential (R10)', () => {
		render(<ThreadMessagePreview message={reply} sequential />, { wrapper: mockMessageProviders({ relatedData }).wrapper });

		expect(screen.queryByText('the thread')).not.toBeInTheDocument();
		expect(screen.getByText('a reply')).toBeInTheDocument();
	});

	it('shows a small avatar of the reply author only when avatars are on and messages are not being selected (R14)', () => {
		const off = render(<ThreadMessagePreview message={reply} sequential={false} />, {
			wrapper: mockMessageProviders({ relatedData, display: { showAvatars: false } }).wrapper,
		});
		expect(screen.queryByRole('figure')).not.toBeInTheDocument();
		off.unmount();

		const selecting = render(<ThreadMessagePreview message={reply} sequential={false} />, {
			wrapper: mockMessageProviders({ relatedData, selection: createMessageSelectionStore({ isSelecting: true }) }).wrapper,
		});
		expect(screen.queryByRole('figure')).not.toBeInTheDocument();
		selecting.unmount();

		render(<ThreadMessagePreview message={reply} sequential={false} />, { wrapper: mockMessageProviders({ relatedData }).wrapper });
		expect(screen.getByRole('figure')).toBeInTheDocument();
	});
});

describe('what the thread started with', () => {
	it('shows what the thread started with, above the reply, and the translated indicator after both (R36)', () => {
		render(<ThreadMessagePreview message={reply} sequential={false} />, {
			wrapper: mockMessageProviders({ relatedData, display: { isTranslated: () => true } }).wrapper,
		});

		expect(screen.getByText('the thread')).toBeInTheDocument();
		expect(screen.getByText('a reply')).toBeInTheDocument();
		expect(screen.getAllByTitle('Translated')).toHaveLength(2);
	});

	it('shows a skeleton while it loads and nothing when it fails (R36)', () => {
		const loading = render(<ThreadMessagePreview message={reply} sequential={false} />, {
			wrapper: mockMessageProviders({ relatedData: parentQuery(undefined, { isLoading: true }) }).wrapper,
		});
		expect(loading.container.querySelector('.rcx-skeleton')).toBeInTheDocument();
		loading.unmount();

		const failed = render(<ThreadMessagePreview message={reply} sequential={false} />, {
			wrapper: mockMessageProviders({ relatedData: parentQuery(undefined, { isError: true }) }).wrapper,
		});
		expect(failed.container.querySelector('.rcx-skeleton')).not.toBeInTheDocument();
		expect(screen.getByText('a reply')).toBeInTheDocument();
	});

	it('shows the description or the title of an attachment when the thread started with a file, and a label when it has neither (R36)', () => {
		const file = (attachments: IMessage['attachments']) => createFakeMessage({ _id: 'main', msg: '', attachments });
		const described = render(<ThreadMessagePreview message={reply} sequential={false} />, {
			wrapper: mockMessageProviders({ relatedData: parentQuery(file([{ title: 'report.pdf', description: 'quarterly report' }])) }).wrapper,
		});
		expect(screen.getByText('quarterly report')).toBeInTheDocument();
		described.unmount();

		const titled = render(<ThreadMessagePreview message={reply} sequential={false} />, {
			wrapper: mockMessageProviders({ relatedData: parentQuery(file([{ title: 'report.pdf' }])) }).wrapper,
		});
		expect(screen.getByText('report.pdf')).toBeInTheDocument();
		titled.unmount();

		render(<ThreadMessagePreview message={reply} sequential={false} />, {
			wrapper: mockMessageProviders({ relatedData: parentQuery(file([{ color: 'red' }])) }).wrapper,
		});
		expect(screen.getByText('Message_with_attachment')).toBeInTheDocument();
	});

	it('shows the text of the type when the thread started with a system message (R36)', () => {
		const system = createFakeMessage({ _id: 'main', t: 'uj', msg: 'carol' });
		render(<ThreadMessagePreview message={reply} sequential={false} />, {
			wrapper: mockMessageProviders({
				relatedData: parentQuery(system),
				root: mockAppRoot().withTranslations('en', 'core', { User_joined_the_channel: 'joined the channel' }),
			}).wrapper,
		});

		expect(screen.getByText('joined the channel')).toBeInTheDocument();
		expect(screen.queryByText('the thread')).not.toBeInTheDocument();
	});

	it('shows the encrypted placeholder when the thread started with a message not decrypted yet (R30)', () => {
		const encrypted = createFakeMessage({ _id: 'main', t: 'e2e', e2e: 'pending', msg: 'ciphertext' } as Partial<IMessage>);
		render(<ThreadMessagePreview message={reply} sequential={false} />, {
			wrapper: mockMessageProviders({ relatedData: parentQuery(encrypted) }).wrapper,
		});

		expect(screen.getByText('E2E_message_encrypted_placeholder')).toBeInTheDocument();
		expect(screen.queryByText('ciphertext')).not.toBeInTheDocument();
	});

	it('shows the encrypted placeholder in place of a reply that is not decrypted yet (R30)', () => {
		render(<ThreadMessagePreview message={{ ...reply, t: 'e2e', e2e: 'pending', msg: 'ciphertext' } as IThreadMessage} sequential />, {
			wrapper: mockMessageProviders({ relatedData }).wrapper,
		});

		expect(screen.getByText('E2E_message_encrypted_placeholder')).toBeInTheDocument();
		expect(screen.queryByText('ciphertext')).not.toBeInTheDocument();
	});
});

describe('ignored messages', () => {
	it('shows Message_Ignored for an ignored reply and an ignored origin, with no way to reveal them (R29)', () => {
		const ignoredReply = render(<ThreadMessagePreview message={{ ...reply, ignored: true } as IThreadMessage} sequential />, {
			wrapper: mockMessageProviders({ relatedData }).wrapper,
		});
		expect(screen.getByText('Message_Ignored')).toBeInTheDocument();
		expect(screen.queryByText('a reply')).not.toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Message_Ignored' })).not.toBeInTheDocument();
		ignoredReply.unmount();

		render(<ThreadMessagePreview message={reply} sequential={false} />, {
			wrapper: mockMessageProviders({ relatedData: parentQuery({ ...parent, ignored: true } as IMessage) }).wrapper,
		});
		expect(screen.getByText('Message_Ignored')).toBeInTheDocument();
		expect(screen.queryByText('the thread')).not.toBeInTheDocument();
		expect(screen.getByText('a reply')).toBeInTheDocument();
	});
});

describe('opening the thread', () => {
	it('opens the thread at its start from the first reply of a run, once it has loaded (R36)', async () => {
		const { wrapper, navigation } = mockMessageProviders({ relatedData });
		render(<ThreadMessagePreview message={reply} sequential={false} />, { wrapper });

		await userEvent.click(screen.getByRole('link'));
		expect(navigation.openThread).toHaveBeenCalledWith({ rid: 'room', tmid: 'main', messageId: 'main' });
		navigation.openThread.mockClear();

		act(() => screen.getByRole('link').focus());
		await userEvent.keyboard('{Enter}');
		await userEvent.keyboard(' ');
		expect(navigation.openThread).toHaveBeenCalledTimes(2);
	});

	it('opens nothing from the first reply of a run before the thread start has loaded (R36)', async () => {
		const { wrapper, navigation } = mockMessageProviders({ relatedData: parentQuery(undefined, { isLoading: true }) });
		render(<ThreadMessagePreview message={reply} sequential={false} />, { wrapper });

		await userEvent.click(screen.getByRole('link'));

		expect(navigation.openThread).not.toHaveBeenCalled();
	});

	it('opens the thread at the reply from a later reply of a run (R36)', async () => {
		const { wrapper, navigation } = mockMessageProviders({ relatedData });
		render(<ThreadMessagePreview message={reply} sequential />, { wrapper });

		await userEvent.click(screen.getByRole('link'));

		expect(navigation.openThread).toHaveBeenCalledWith({ rid: 'room', tmid: 'main', messageId: 'reply' });
	});

	it('toggles the selection instead of opening the thread while selecting, by a click, Space or Enter (R22)', async () => {
		const selection = createMessageSelectionStore({ isSelecting: true });
		const { wrapper, navigation } = mockMessageProviders({ relatedData, selection });
		render(<ThreadMessagePreview message={reply} sequential={false} />, { wrapper });

		await userEvent.click(screen.getByRole('link'));
		expect(selection.isSelected('reply')).toBe(true);
		act(() => screen.getByRole('link').focus());
		await userEvent.keyboard('{Enter}');
		expect(selection.isSelected('reply')).toBe(false);
		await userEvent.keyboard(' ');
		expect(selection.isSelected('reply')).toBe(true);
		expect(navigation.openThread).not.toHaveBeenCalled();
	});

	it('shows a checkbox named by the author in place of the avatar while selecting (R19)', () => {
		render(<ThreadMessagePreview message={reply} sequential={false} />, {
			wrapper: mockMessageProviders({ relatedData, selection: createMessageSelectionStore({ isSelecting: true }) }).wrapper,
		});

		expect(screen.getByRole('checkbox', { name: 'Select_message_from_user_with_preview' })).not.toBeChecked();
	});
});

describe('known defects', () => {
	// Known defect: ../../../docs/specs/message-variants.md#d4-a-thread-preview-has-no-per-message-fallback
	it.skip('shows a placeholder instead of failing when the content cannot be rendered', () => {
		jest.spyOn(console, 'error').mockImplementation(() => undefined);
		const Throwing = () => {
			throw new Error('cannot render');
		};

		render(<ThreadMessagePreview message={reply} sequential />, {
			wrapper: mockMessageProviders({ relatedData, renderers: { PreviewMarkup: Throwing } }).wrapper,
		});

		expect(screen.getByText('Message_could_not_be_displayed')).toBeInTheDocument();
	});

	// Known defect: ../../../docs/specs/message-variants.md#d5-space-on-a-thread-preview-does-not-prevent-the-default
	it.skip('prevents the default of Space when it opens the thread', () => {
		render(<ThreadMessagePreview message={reply} sequential />, { wrapper: mockMessageProviders({ relatedData }).wrapper });

		const event = new KeyboardEvent('keydown', { code: 'Space', bubbles: true, cancelable: true });
		screen.getByRole('link').dispatchEvent(event);

		expect(event.defaultPrevented).toBe(true);
	});

	// Known defect: ../../../docs/specs/message-variants.md#d8-the-preview-of-a-reply-to-a-system-message-writes-the-text-from-the-reply
	it.skip('writes the text of the type from the message the thread started with', () => {
		const removed = createFakeMessage({ _id: 'main', t: 'ru', msg: 'carol' });
		render(<ThreadMessagePreview message={reply} sequential={false} />, {
			wrapper: mockMessageProviders({
				relatedData: parentQuery(removed),
				root: mockAppRoot().withTranslations('en', 'core', { User_has_been_removed: '{{user_removed}} was removed' }),
			}).wrapper,
		});

		expect(screen.getByText('carol was removed')).toBeInTheDocument();
	});
});

describe('stories', () => {
	const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

	test.each(testCases)('%s should have no accessibility violations (R8)', async (_storyName, Story) => {
		const { container } = render(<Story />);

		expect(await axe(container)).toHaveNoViolations();
	});
});
