import { after, afterEach, before, beforeEach, describe, it, mock } from 'node:test';

import type { IMessage } from '@rocket.chat/core-typings';
import { render, screen } from '@testing-library/react';
import { expect } from 'expect';
import type { TFunction } from 'i18next';
import { ModuleMocker, mocked } from 'jest-mock';
import type { Mocked } from 'jest-mock';

import { enterModuleScope, leaveModuleScope } from '../../tests/mocks/moduleScope';

let parse: (typeof import('@rocket.chat/message-parser'))['parse'];
let getMarkdownParserLimit: (typeof import('./getMarkdownParserLimit'))['getMarkdownParserLimit'];
let normalizeThreadMessage: (typeof import('./normalizeThreadMessage'))['normalizeThreadMessage'];
let filterMarkdown: (typeof import('../../lib/markdown/parser/filtered/filtered'))['filterMarkdown'];
let mockedGetMarkdownParserLimit: Mocked<typeof getMarkdownParserLimit>;
let mockedFilterMarkdown: Mocked<typeof filterMarkdown>;
let mockedParse: Mocked<typeof parse>;

const mocker = new ModuleMocker(globalThis);
const fn: ModuleMocker['fn'] = mocker.fn.bind(mocker);

const t = ((key: string) => key) as TFunction;

describe('normalizeThreadMessage', () => {
	before(() => {
		enterModuleScope();
		mock.module('./getMarkdownParserLimit', { exports: { getMarkdownParserLimit: fn() } });
		mock.module('../../lib/markdown/parser/filtered/filtered', { exports: { filtered: fn(), filterMarkdown: fn() } });
		mock.module(require.resolve('@rocket.chat/message-parser'), {
			exports: Object.fromEntries(
				Object.entries(require('@rocket.chat/message-parser')).map(([key, value]) => [key, typeof value === 'function' ? fn() : value]),
			),
		});
		mock.module('../../app/utils/rocketchat.info', { exports: {} });
		({ parse } = require('@rocket.chat/message-parser'));
		({ getMarkdownParserLimit } = require('./getMarkdownParserLimit'));
		({ normalizeThreadMessage } = require('./normalizeThreadMessage'));
		({ filterMarkdown } = require('../../lib/markdown/parser/filtered/filtered'));
		mockedGetMarkdownParserLimit = mocked(getMarkdownParserLimit);
		mockedFilterMarkdown = mocked(filterMarkdown);
		mockedParse = mocked(parse);
	});

	after(leaveModuleScope);
	beforeEach(() => {
		mockedGetMarkdownParserLimit.mockReturnValue(Infinity);
		mockedFilterMarkdown.mockImplementation((text) => text);
		mockedParse.mockImplementation((text) => [{ type: 'PARAGRAPH', value: [{ type: 'PLAIN_TEXT', value: text }] }] as any);
	});

	afterEach(() => {
		mocker.resetAllMocks();
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
