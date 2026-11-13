import type { MessageAttachmentBase, MessageAttachmentDefault, MessageQuoteAttachment } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { MarkdownTextContext } from '@rocket.chat/ui-client';
import { AttachmentContext } from '@rocket.chat/ui-contexts';
import { composeStories } from '@storybook/react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import type { ReactNode } from 'react';

import Attachments from './Attachments';
import * as stories from './Attachments.stories';
import { mockMessageProviders } from '../../../tests/utils/mockMessageProviders';
import { createMediaPlayerStore, messageMediaDefaultValue } from '../contexts/MessageMediaContext';
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

	it('should download through downloadEncrypted (R10)', async () => {
		const downloadEncrypted = jest.fn();
		render(<Attachments attachments={[encryptedFile]} />, {
			wrapper: mockMessageProviders({ media: { ...messageMediaDefaultValue, downloadEncrypted } }).wrapper,
		});

		await userEvent.click(screen.getByTitle('Download'));

		expect(downloadEncrypted).toHaveBeenCalledWith('/file-decrypt/id/secret.zip', 'secret.zip');
	});

	it('should be disabled while encrypted downloads are unavailable (R10)', () => {
		render(<Attachments attachments={[encryptedFile]} />, {
			wrapper: mockMessageProviders({ media: { canDownloadEncrypted: false } }).wrapper,
		});

		expect(screen.getByTitle('Download_Disabled')).toBeInTheDocument();
	});
});

describe('action buttons', () => {
	it('should open a link button through openExternalLink (R7)', async () => {
		const { wrapper, navigation } = mockMessageProviders({ navigation: { openExternalLink: () => undefined } });
		render(<Attachments attachments={[actionAttachment([{ type: 'button', text: 'Open', url: 'https://example.com' }])]} />, { wrapper });

		await userEvent.click(screen.getByRole('link', { name: 'Open' }));

		expect(navigation.openExternalLink).toHaveBeenCalledWith('https://example.com');
	});

	it.each([
		['sendMessage', 'sendMessage', '/retry 42'],
		['respondWithMessage', 'replyWith', '/retry 42'],
	] as const)('should %s through %s (R7)', async (processingType, capability, msg) => {
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

	it('should quote the message through quoteMessageById (R7)', async () => {
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
	it('should play the track in the shared player (R8)', async () => {
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
			{
				wrapper: mockMessageProviders({
					media: { player: createMediaPlayerStore({ ...messageMediaDefaultValue.player.getSnapshot(), play }) },
				}).wrapper,
			},
		);

		await userEvent.click(screen.getByRole('button', { name: 'Play' }));

		expect(play).toHaveBeenCalledWith(
			expect.objectContaining({ id: 'message:/file-upload/id/note.mp3', url: '/file-upload/id/note.mp3', rid: 'room', mid: 'message' }),
		);
	});
});

describe('video', () => {
	const originalFetch = global.fetch;
	const originalLoad = HTMLMediaElement.prototype.load;
	let debug: jest.SpyInstance;

	beforeEach(() => {
		debug = jest.spyOn(console, 'debug').mockImplementation(() => undefined);
		HTMLMediaElement.prototype.load = jest.fn();
		global.fetch = jest.fn(async () => ({
			ok: true,
			json: async () => ({ redirectUrl: '/file-upload/id/demo.mp4?sig=new', expires: new Date(Date.now() + 60_000).toISOString() }),
		})) as never;
	});

	afterEach(() => {
		debug.mockRestore();
		global.fetch = originalFetch;
		HTMLMediaElement.prototype.load = originalLoad;
	});

	it('should recover the url of a video whose signed url expired (R9)', async () => {
		const { container } = render(
			<Attachments
				attachments={[
					{
						type: 'file',
						title: 'demo.mp4',
						title_link: '/file-upload/id/demo.mp4',
						video_url: '/file-upload/id/demo.mp4?sig=old',
						video_type: 'video/mp4',
					} as MessageAttachmentBase,
				]}
			/>,
			{ wrapper: mockMessageProviders().wrapper },
		);
		// A video has no role to find it by.
		// oxlint-disable-next-line testing-library/no-container, testing-library/no-node-access
		const video = container.querySelector('video') as HTMLVideoElement;

		await act(async () => {
			video.dispatchEvent(new Event('error'));
		});

		expect(global.fetch).toHaveBeenCalledWith(
			expect.objectContaining({ pathname: '/file-upload/id/demo.mp4', search: '?sig=old&replyWithRedirectUrl=true' }),
			{ credentials: 'same-origin' },
		);
		expect(video.src).toContain('sig=new');
	});
});

describe('the shared player', () => {
	const audio = {
		type: 'file',
		title: 'note.mp3',
		audio_url: '/file-upload/id/note.mp3',
		audio_type: 'audio/mpeg',
		audio_size: 1024,
	} as MessageAttachmentBase;
	const file = { type: 'file', title: 'report.txt', title_link: '/report.txt', format: 'TXT' } as MessageAttachmentBase;

	it('should reach the audio attachment when the player changes and no other attachment (R20)', () => {
		const store = createMediaPlayerStore();
		const rendered = jest.fn();
		// Draws the description of the file, so it renders whenever the file attachment does.
		const Description = ({ content }: { content: string }) => {
			if (content) {
				rendered();
			}
			return <>{content}</>;
		};
		render(
			<MarkdownTextContext.Provider value={Description}>
				<Attachments source={source} attachments={[{ ...file, description: 'the description' } as MessageAttachmentBase, audio]} />
			</MarkdownTextContext.Provider>,
			{ wrapper: mockMessageProviders({ media: { player: store } }).wrapper },
		);
		const rendersBefore = rendered.mock.calls.length;

		expect(rendersBefore).toBeGreaterThan(0);
		expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument();

		act(() =>
			store.set({
				...store.getSnapshot(),
				track: { id: 'message:/file-upload/id/note.mp3', url: '/file-upload/id/note.mp3', title: 'note.mp3' },
				isActive: (id) => id === 'message:/file-upload/id/note.mp3',
				playing: true,
				currentTime: 3,
			}),
		);

		expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument();
		expect(rendered).toHaveBeenCalledTimes(rendersBefore);
	});
});

describe('collapse', () => {
	it('should remember a default attachment collapse state by message and position (R3)', async () => {
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

	it('should hide the content of a collapsed image (R3)', async () => {
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

const imageAttachment = {
	type: 'file',
	title: 'diagram.png',
	title_link: '/diagram.png',
	image_url: '/diagram.png',
	image_alt: 'Diagram',
} as MessageAttachmentBase;

const withAttachmentPreferences = (preferences: Partial<React.ContextType<typeof AttachmentContext>>) =>
	mockAppRoot().wrap((children: ReactNode) => (
		<AttachmentContext.Provider
			value={{
				getURL: (url) => url,
				dimensions: { width: 368, height: 368 },
				collapsedByDefault: false,
				autoLoadEmbedMedias: true,
				...preferences,
			}}
		>
			{children}
		</AttachmentContext.Provider>
	));

describe('rendering', () => {
	it('should render each kind of attachment and nothing for none (R1)', () => {
		const { container, rerender } = render(
			<Attachments
				attachments={[
					{ title: 'Pipeline', text: 'All checks passed.' } as MessageAttachmentDefault,
					imageAttachment,
					{
						type: 'file',
						title: 'demo.mp4',
						title_link: '/demo.mp4',
						video_url: '/demo.mp4',
						video_type: 'video/mp4',
						video_size: 10,
					} as MessageAttachmentBase,
					{ type: 'file', title: 'report.txt', title_link: '/report.txt', format: 'TXT' } as MessageAttachmentBase,
					{ text: 'Quoted text', author_name: 'bob', message_link: '/channel/general?msg=1' } as MessageQuoteAttachment,
				]}
			/>,
			{ wrapper: mockMessageProviders().wrapper },
		);

		expect(screen.getByText('Pipeline')).toBeInTheDocument();
		expect(screen.getByText('All checks passed.')).toBeInTheDocument();
		expect(screen.getByRole('img', { name: 'Diagram' })).toBeInTheDocument();
		expect(screen.getAllByText('demo.mp4').length).toBeGreaterThan(0);
		expect(screen.getAllByText('report.txt').length).toBeGreaterThan(0);
		expect(screen.getByText('bob')).toBeInTheDocument();
		expect(screen.getByText('Quoted text')).toBeInTheDocument();

		rerender(<Attachments attachments={[]} />);

		expect(container).toBeEmptyDOMElement();
	});

	it('should show an image at once or on demand by the viewer preference (R2)', async () => {
		const { unmount } = render(<Attachments attachments={[imageAttachment]} />, {
			wrapper: mockMessageProviders({ root: withAttachmentPreferences({ autoLoadEmbedMedias: true }) }).wrapper,
		});
		expect(screen.getByRole('img', { name: 'Diagram' })).toBeInTheDocument();
		unmount();

		render(<Attachments attachments={[imageAttachment]} />, {
			wrapper: mockMessageProviders({ root: withAttachmentPreferences({ autoLoadEmbedMedias: false }) }).wrapper,
		});
		expect(screen.queryByRole('img', { name: 'Diagram' })).not.toBeInTheDocument();

		await userEvent.click(screen.getByText('Click_to_load'));

		expect(screen.getByRole('img', { name: 'Diagram' })).toBeInTheDocument();
	});

	it('should show an image as what the image gallery opens from (R2)', () => {
		render(
			<Attachments attachments={[{ ...imageAttachment, id: 'file-id', title_link: '/full/diagram.png' } as MessageAttachmentBase]} />,
			{
				wrapper: mockMessageProviders({ root: withAttachmentPreferences({ autoLoadEmbedMedias: true }) }).wrapper,
			},
		);

		const image = screen.getByRole('img', { name: 'Diagram' });

		expect(image).toHaveClass('gallery-item');
		expect(image).toHaveAttribute('data-id', 'file-id');
		expect(image).toHaveAttribute('data-src', '/full/diagram.png');
	});

	it('should show the size of an image, a video and an audio file beside its title as the media context formats it (R5)', () => {
		render(
			<Attachments
				source={source}
				attachments={[
					{ ...imageAttachment, image_size: 2048 } as MessageAttachmentBase,
					{
						type: 'file',
						title: 'demo.mp4',
						title_link: '/demo.mp4',
						video_url: '/demo.mp4',
						video_type: 'video/mp4',
						video_size: 4096,
					} as MessageAttachmentBase,
					{
						type: 'file',
						title: 'note.mp3',
						title_link: '/note.mp3',
						audio_url: '/note.mp3',
						audio_type: 'audio/mpeg',
						audio_size: 8192,
					} as MessageAttachmentBase,
				]}
			/>,
			{ wrapper: mockMessageProviders({ media: { formatFileSize: (bytes) => `${bytes / 1024} kibibytes` } }).wrapper },
		);

		expect(screen.getByText('(2 kibibytes)')).toBeInTheDocument();
		expect(screen.getByText('(4 kibibytes)')).toBeInTheDocument();
		expect(screen.getByText('(8 kibibytes)')).toBeInTheDocument();
	});

	it('should start collapsed when the viewer collapses media by default (R3)', () => {
		render(<Attachments attachments={[imageAttachment]} />, {
			wrapper: mockMessageProviders({ root: withAttachmentPreferences({ collapsedByDefault: true }) }).wrapper,
		});

		expect(screen.queryByRole('img', { name: 'Diagram' })).not.toBeInTheDocument();
	});

	it('should show a description as markdown when it has parsed markdown and as text otherwise (R4)', () => {
		render(
			<Attachments
				attachments={[
					{
						...imageAttachment,
						title: 'a.png',
						description: 'source description',
						descriptionMd: [{ type: 'PARAGRAPH', value: [{ type: 'PLAIN_TEXT', value: 'parsed description' }] }],
					} as MessageAttachmentBase,
					{ ...imageAttachment, title: 'b.png', description: 'plain description' } as MessageAttachmentBase,
				]}
			/>,
			{ wrapper: mockMessageProviders().wrapper },
		);

		expect(screen.getByRole('document')).toHaveTextContent('parsed description');
		expect(screen.getAllByRole('document')).toHaveLength(1);
		expect(screen.getByText('plain description')).toBeInTheDocument();
	});

	describe('the markdown of quotes and descriptions', () => {
		// Stands in for the app's renderer, which draws the source text of a block it does not know from its fallback span.
		const Markup = ({ md, msg }: { md: unknown; msg?: string }) => {
			const [block] = md as { type: string; value: string; fallback?: [number, number] }[];
			return <span>{block.fallback && msg !== undefined ? msg.slice(...block.fallback) : block.value}</span>;
		};

		const unknownBlock = [{ type: 'FUTURE_BLOCK', value: '', fallback: [0, 10] }] as never;
		const quoteOf = (props: object) =>
			({ author_name: 'bob', message_link: '/channel/general?msg=quoted', ...props }) as unknown as MessageQuoteAttachment;

		it('should not show the source of a block the renderer does not know in a quote or a description (R4)', () => {
			render(
				<Attachments
					attachments={[
						quoteOf({ text: 'raw quote source', md: unknownBlock }),
						{ ...imageAttachment, description: 'raw description source', descriptionMd: unknownBlock } as MessageAttachmentBase,
					]}
				/>,
				{ wrapper: mockMessageProviders({ renderers: { Markup } }).wrapper },
			);

			expect(screen.queryByText(/raw quote/)).not.toBeInTheDocument();
			expect(screen.queryByText(/raw descr/)).not.toBeInTheDocument();
		});

		it('should not cut the text of a translated quote or description from the original text (R4)', () => {
			// The offsets of a block belong to the translation the markdown was parsed from, not to the original text.
			const translatedUnknownBlock = [{ type: 'FUTURE_BLOCK', value: '', fallback: [0, 8] }] as never;
			render(
				<Attachments
					attachments={[
						quoteOf({ text: 'original quote text', md: translatedUnknownBlock }),
						{ ...imageAttachment, description: 'original description', descriptionMd: translatedUnknownBlock } as MessageAttachmentBase,
					]}
				/>,
				{ wrapper: mockMessageProviders({ renderers: { Markup } }).wrapper },
			);

			expect(screen.queryByText('original')).not.toBeInTheDocument();
		});
	});

	it('should show a quote with its author link, avatar by preference, time, message link, nested attachments and text (R6)', () => {
		const quote = {
			text: 'Can we ship this on Friday?',
			author_name: 'bob',
			author_icon: '/avatar/bob',
			author_link: '/direct/bob',
			message_link: '/channel/general?msg=quoted',
			ts: new Date('2024-03-10T15:20:00.000Z'),
			attachments: [{ type: 'file', title: 'report.txt', title_link: '/report.txt' }],
		} as unknown as MessageQuoteAttachment;

		const view = render(<Attachments attachments={[quote]} />, {
			wrapper: mockMessageProviders({ root: mockAppRoot().withUserPreference('displayAvatars', true) }).wrapper,
		});

		expect(screen.getByRole('link', { name: 'bob' })).toHaveAttribute('href', '/direct/bob');
		expect(screen.getByRole('figure', { hidden: true })).toBeInTheDocument();
		expect(screen.getByTitle('Jump_to_message')).toHaveAttribute('href', '/channel/general?msg=quoted');
		expect(screen.getAllByText('report.txt').length).toBeGreaterThan(0);
		expect(screen.getByText('Can we ship this on Friday?')).toBeInTheDocument();
		view.unmount();

		render(<Attachments attachments={[quote]} />, {
			wrapper: mockMessageProviders({ root: mockAppRoot().withUserPreference('displayAvatars', false) }).wrapper,
		});

		expect(screen.queryByRole('figure', { hidden: true })).not.toBeInTheDocument();
	});

	it("should key the collapse state of a quote's nested attachments apart from the quote's own (R3)", () => {
		const useCollapsedState = jest.fn<ReturnType<MessageRelatedDataContextValue['useCollapsedState']>, [string, boolean]>(() => [
			false,
			jest.fn(),
		]);
		const quote = {
			text: 'quoted',
			author_name: 'bob',
			message_link: '/channel/general?msg=quoted',
			attachments: [{ title: 'Pipeline', text: 'Nested' }],
		} as unknown as MessageQuoteAttachment;

		render(<Attachments source={source} attachments={[{ title: 'Top', text: 'Top text' } as MessageAttachmentDefault, quote]} />, {
			wrapper: mockMessageProviders({ relatedData: { useCollapsedState } }).wrapper,
		});

		const keys = useCollapsedState.mock.calls.map(([key]) => key);
		expect(keys).toEqual(expect.arrayContaining(['message-0', 'message-1-0']));
	});
});

describe('stories', () => {
	const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

	test.each(testCases)('%s should have no accessibility violations (R13)', async (_storyName, Story) => {
		const { container } = render(<Story />);

		await act(async () => undefined);

		expect(await axe(container)).toHaveNoViolations();
	});
});
