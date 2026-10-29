import type { MessageAttachmentBase, MessageAttachmentDefault } from '@rocket.chat/core-typings';
import { composeStories } from '@storybook/react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';

import Attachments from './Attachments';
import * as stories from './Attachments.stories';
import { mockMessageProviders } from '../../../../tests/utils/mockMessageProviders';
import { messageMediaDefaultValue } from '../contexts/MessageMediaContext';
import type { MessageRelatedDataContextValue } from '../contexts/MessageRelatedDataContext';

const source = { rid: 'room', mid: 'message', username: 'alice', name: 'Alice' };

const actionAttachment = (actions: object[]) => ({ actions }) as unknown as MessageAttachmentDefault;

describe('encrypted download', () => {
	const encryptedFile = {
		type: 'file',
		title: 'secret.zip',
		title_link: '/file-decrypt/id/secret.zip',
		title_link_download: true,
		format: 'ZIP',
	} as MessageAttachmentBase;

	it('should download through downloadEncrypted', async () => {
		const downloadEncrypted = jest.fn();
		render(<Attachments attachments={[encryptedFile]} />, {
			wrapper: mockMessageProviders({ media: { ...messageMediaDefaultValue, downloadEncrypted } }).wrapper,
		});

		await userEvent.click(screen.getByTitle('Download'));

		expect(downloadEncrypted).toHaveBeenCalledWith('/file-decrypt/id/secret.zip', 'secret.zip');
	});

	it('should be disabled while encrypted downloads are unavailable', () => {
		render(<Attachments attachments={[encryptedFile]} />, {
			wrapper: mockMessageProviders({ media: { canDownloadEncrypted: false } }).wrapper,
		});

		expect(screen.getByTitle('Download_Disabled')).toBeInTheDocument();
	});
});

describe('action buttons', () => {
	it('should open a link button through openExternalLink', async () => {
		const { wrapper, navigation } = mockMessageProviders({ navigation: { openExternalLink: () => undefined } });
		render(<Attachments attachments={[actionAttachment([{ type: 'button', text: 'Open', url: 'https://example.com' }])]} />, { wrapper });

		await userEvent.click(screen.getByRole('link', { name: 'Open' }));

		expect(navigation.openExternalLink).toHaveBeenCalledWith('https://example.com');
	});

	it.each([
		['sendMessage', 'sendMessage', '/retry 42'],
		['respondWithMessage', 'replyWith', '/retry 42'],
	] as const)('should %s through %s', async (processingType, capability, msg) => {
		const { wrapper, interactions } = mockMessageProviders();
		render(
			<Attachments
				attachments={[
					actionAttachment([{ type: 'button', text: 'Retry', msg, msg_in_chat_window: true, msg_processing_type: processingType }]),
				]}
			/>,
			{ wrapper },
		);

		await userEvent.click(screen.getByRole('button', { name: 'Retry' }));

		expect(interactions[capability]).toHaveBeenCalledWith(msg);
	});

	it('should quote the message through quoteMessageById', async () => {
		const { wrapper, interactions } = mockMessageProviders();
		render(
			<Attachments
				attachments={[
					actionAttachment([
						{ type: 'button', text: 'Quote', msgId: 'quoted', msg_in_chat_window: true, msg_processing_type: 'respondWithQuotedMessage' },
					]),
				]}
			/>,
			{ wrapper },
		);

		await userEvent.click(screen.getByRole('button', { name: 'Quote' }));

		expect(interactions.quoteMessageById).toHaveBeenCalledWith('quoted');
	});
});

describe('audio', () => {
	it('should play the track in the shared player', async () => {
		const play = jest.fn();
		render(
			<Attachments
				source={source}
				attachments={[
					{
						type: 'file',
						title: 'note.mp3',
						audio_url: '/file-upload/id/note.mp3',
						audio_type: 'audio/mpeg',
						audio_size: 1024,
					} as MessageAttachmentBase,
				]}
			/>,
			{ wrapper: mockMessageProviders({ media: { player: { ...messageMediaDefaultValue.player, play } } }).wrapper },
		);

		await userEvent.click(screen.getByRole('button', { name: 'Play' }));

		expect(play).toHaveBeenCalledWith(
			expect.objectContaining({ id: 'message:/file-upload/id/note.mp3', url: '/file-upload/id/note.mp3', rid: 'room', mid: 'message' }),
		);
	});
});

describe('collapse', () => {
	it('should remember a default attachment collapse state by message and position', async () => {
		const toggle = jest.fn();
		const useCollapsedState = jest.fn<ReturnType<MessageRelatedDataContextValue['useCollapsedState']>, [string, boolean]>(() => [
			false,
			toggle,
		]);
		render(<Attachments source={source} attachments={[{ title: 'Pipeline', text: 'All checks passed.' } as MessageAttachmentDefault]} />, {
			wrapper: mockMessageProviders({ relatedData: { useCollapsedState } }).wrapper,
		});

		expect(useCollapsedState).toHaveBeenCalledWith('message-0', false);

		await userEvent.click(screen.getByTitle('Collapse'));

		expect(toggle).toHaveBeenCalled();
	});

	it('should hide the content of a collapsed image', async () => {
		render(
			<Attachments
				attachments={[
					{ type: 'file', title: 'diagram.png', image_url: '/diagram.png', image_alt: 'Diagram', collapsed: true } as MessageAttachmentBase,
				]}
			/>,
			{ wrapper: mockMessageProviders().wrapper },
		);

		expect(screen.queryByRole('img', { name: 'Diagram' })).not.toBeInTheDocument();

		await userEvent.click(screen.getByTitle('Uncollapse'));

		expect(screen.getByRole('img', { name: 'Diagram' })).toBeInTheDocument();
	});
});

describe('stories', () => {
	const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

	test.each(testCases)('%s should have no accessibility violations', async (_storyName, Story) => {
		const { container } = render(<Story />);

		await act(async () => undefined);

		expect(await axe(container)).toHaveNoViolations();
	});
});
