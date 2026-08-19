import type { IMessage } from '@rocket.chat/core-typings';
import { parse } from '@rocket.chat/message-parser';
import { render, screen } from '@testing-library/react';
import type { TFunction } from 'i18next';

import { getMarkdownParserLimit } from './getMarkdownParserLimit';
import { normalizeThreadMessage } from './normalizeThreadMessage';
import { filterMarkdown } from '../../app/markdown/lib/markdown';

jest.mock('./getMarkdownParserLimit');
jest.mock('../../app/markdown/lib/markdown');
jest.mock('@rocket.chat/message-parser');
jest.mock('../../app/utils/rocketchat.info', () => ({}));

const mockedGetMarkdownParserLimit = jest.mocked(getMarkdownParserLimit);
const mockedFilterMarkdown = jest.mocked(filterMarkdown);
const mockedParse = jest.mocked(parse);

const t = ((key: string) => key) as TFunction;

describe('normalizeThreadMessage', () => {
	beforeEach(() => {
		mockedGetMarkdownParserLimit.mockReturnValue(Infinity);
		mockedFilterMarkdown.mockImplementation((text) => text);
		mockedParse.mockImplementation((text) => [{ type: 'PARAGRAPH', value: [{ type: 'PLAIN_TEXT', value: text }] }] as any);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	it('should parse message through filterMarkdown and parse when within limit', () => {
		const message = { msg: 'Hello world', mentions: [], attachments: [] } as unknown as IMessage;
		normalizeThreadMessage(message, t);

		expect(mockedFilterMarkdown).toHaveBeenCalledWith('Hello world');
		expect(mockedParse).toHaveBeenCalledWith('Hello world', { emoticons: true });
	});

	it('should skip filterMarkdown and parse when message exceeds limit', () => {
		mockedGetMarkdownParserLimit.mockReturnValue(5);

		const message = { msg: 'This message is longer than the limit', mentions: [], attachments: [] } as unknown as IMessage;
		const result = normalizeThreadMessage(message, t);

		expect(mockedFilterMarkdown).not.toHaveBeenCalled();
		expect(mockedParse).not.toHaveBeenCalled();

		// Still renders (as plain text AST through Markup)
		expect(result).not.toBeNull();
		const { container } = render(<>{result}</>);
		expect(container.textContent).toContain('This message is longer than the limit');
	});

	it('should render one block per line when the message exceeds the limit', () => {
		mockedGetMarkdownParserLimit.mockReturnValue(5);

		const message = { msg: 'line one\nline two', mentions: [], attachments: [] } as unknown as IMessage;
		const result = normalizeThreadMessage(message, t);

		expect(mockedParse).not.toHaveBeenCalled();

		render(<>{result}</>);

		// `getByText` matches an element whose own text equals the query, so these only pass if each
		// line got its own block. A single text node holding the `\n` would normalize to
		// "line one line two" and neither query would match, which is exactly the collapsed rendering
		// this guards against.
		expect(screen.getByText('line one')).toBeInTheDocument();
		expect(screen.getByText('line two')).toBeInTheDocument();
	});

	it('should return null when msg is empty and no attachments', () => {
		const message = { msg: '', mentions: [], attachments: undefined } as unknown as IMessage;
		expect(normalizeThreadMessage(message, t)).toBeNull();
	});

	it('should return attachment title when msg is empty but attachment has title', () => {
		const message = { msg: '', mentions: [], attachments: [{ title: 'file.pdf' }] } as unknown as IMessage;
		const result = normalizeThreadMessage(message, t);

		const { container } = render(<>{result}</>);
		expect(container.textContent).toBe('file.pdf');
	});

	it('should return attachment description when msg is empty and attachments have no title', () => {
		const message = { msg: '', mentions: [], attachments: [{ description: 'desc' }] } as unknown as IMessage;
		const result = normalizeThreadMessage(message, t);

		const { container } = render(<>{result}</>);
		expect(container.textContent).toBe('desc');
	});

	it('should return null when parse throws an error', () => {
		mockedParse.mockImplementation(() => {
			throw new Error('parse error');
		});

		const message = { msg: 'test', mentions: [], attachments: [] } as unknown as IMessage;
		expect(normalizeThreadMessage(message, t)).toBeNull();
	});

	it('should return the message type text for a removed message without content', () => {
		const message = {
			t: 'rm',
			msg: '',
			editedAt: new Date(),
			editedBy: { _id: 'uid', username: 'user' },
			mentions: [],
			attachments: [],
		} as unknown as IMessage;

		expect(normalizeThreadMessage(message, t)).toBe('Message_removed');
		expect(mockedFilterMarkdown).not.toHaveBeenCalled();
		expect(mockedParse).not.toHaveBeenCalled();
	});

	it('should render the message content when a `t: rm` message still has content', () => {
		const message = { t: 'rm', msg: 'Hello world', mentions: [], attachments: [] } as unknown as IMessage;

		expect(normalizeThreadMessage(message, t)).not.toBe('Message_removed');
		expect(mockedParse).toHaveBeenCalledWith('Hello world', { emoticons: true });
	});
});
