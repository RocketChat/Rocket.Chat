import { parse } from '@rocket.chat/message-parser';
import { render } from '@testing-library/react';

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
		const message = { msg: 'Hello world', mentions: [], attachments: [] };
		normalizeThreadMessage(message);

		expect(mockedFilterMarkdown).toHaveBeenCalledWith('Hello world');
		expect(mockedParse).toHaveBeenCalledWith('Hello world', { emoticons: true });
	});

	it('should skip filterMarkdown and parse when message exceeds limit', () => {
		mockedGetMarkdownParserLimit.mockReturnValue(5);

		const message = { msg: 'This message is longer than the limit', mentions: [], attachments: [] };
		const result = normalizeThreadMessage(message);

		expect(mockedFilterMarkdown).not.toHaveBeenCalled();
		expect(mockedParse).not.toHaveBeenCalled();

		// Still renders (as plain text AST through Markup)
		expect(result).not.toBeNull();
		const { container } = render(<>{result}</>);
		expect(container.textContent).toContain('This message is longer than the limit');
	});

	it('should return null when msg is empty and no attachments', () => {
		const message = { msg: '', mentions: [], attachments: undefined } as any;
		expect(normalizeThreadMessage(message)).toBeNull();
	});

	it('should return attachment title when msg is empty but attachment has title', () => {
		const message = { msg: '', mentions: [], attachments: [{ title: 'file.pdf' }] } as any;
		const result = normalizeThreadMessage(message);

		const { container } = render(<>{result}</>);
		expect(container.textContent).toBe('file.pdf');
	});

	it('should return attachment description when msg is empty and attachments have no title', () => {
		const message = { msg: '', mentions: [], attachments: [{ description: 'desc' }] } as any;
		const result = normalizeThreadMessage(message);

		const { container } = render(<>{result}</>);
		expect(container.textContent).toBe('desc');
	});

	it('should return null when parse throws an error', () => {
		mockedParse.mockImplementation(() => {
			throw new Error('parse error');
		});

		const message = { msg: 'test', mentions: [], attachments: [] };
		expect(normalizeThreadMessage(message)).toBeNull();
	});
});
