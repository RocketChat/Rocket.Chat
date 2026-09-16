import type { IThreadMainMessage } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook } from '@testing-library/react';

import { useNormalizedThreadTitleHtml } from './useNormalizedThreadTitleHtml';
import { filterMarkdown } from '../../../../../../app/markdown/lib/markdown';

jest.mock('../../../../../../app/markdown/lib/markdown', () => ({
	filterMarkdown: jest.fn((text: string) => text),
}));

jest.mock('../../../../../lib/emoji/emojiParser', () => ({
	emojiParser: jest.fn((text: string) => text),
}));

const mockedFilterMarkdown = jest.mocked(filterMarkdown);

const baseMessage = {
	_id: 'msg-id',
	rid: 'rid',
	ts: new Date(),
	u: { _id: 'uid', username: 'user' },
	_updatedAt: new Date(),
	tcount: 1,
	tlm: new Date(),
	replies: [],
} as unknown as IThreadMainMessage;

describe('useNormalizedThreadTitleHtml', () => {
	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should return the "Message_removed" translation for a removed message without content', () => {
		const message = {
			...baseMessage,
			t: 'rm',
			msg: '',
			editedAt: new Date(),
			editedBy: { _id: 'uid', username: 'user' },
		} as unknown as IThreadMainMessage;

		const { result } = renderHook(() => useNormalizedThreadTitleHtml(message), {
			wrapper: mockAppRoot().build(),
		});

		expect(result.current).toBe('Message_removed');
		expect(mockedFilterMarkdown).not.toHaveBeenCalled();
	});

	it('should return the normalized message content for a regular message', () => {
		const message = { ...baseMessage, msg: 'Hello world' } as unknown as IThreadMainMessage;

		const { result } = renderHook(() => useNormalizedThreadTitleHtml(message), {
			wrapper: mockAppRoot().build(),
		});

		expect(result.current).toBe('Hello world');
		expect(mockedFilterMarkdown).toHaveBeenCalledWith('Hello world');
	});

	it('should render the message content when a `t: rm` message still has content', () => {
		const message = { ...baseMessage, t: 'rm', msg: 'Hello world' } as unknown as IThreadMainMessage;

		const { result } = renderHook(() => useNormalizedThreadTitleHtml(message), {
			wrapper: mockAppRoot().build(),
		});

		expect(result.current).not.toBe('Message_removed');
		expect(result.current).toBe('Hello world');
	});
});
