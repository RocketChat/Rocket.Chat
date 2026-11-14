import type { IMessage, IThreadMainMessage } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, renderHook, waitFor } from '@testing-library/react';

import { useThreadJumpTarget } from './useThreadJumpTarget';
import { setMessageJumpQueryStringParameter } from '../../../../../lib/utils/setMessageJumpQueryStringParameter';

jest.mock('../../../../../lib/utils/setMessageJumpQueryStringParameter', () => ({ setMessageJumpQueryStringParameter: jest.fn() }));

const main = { _id: 'main' } as IThreadMainMessage;
const loaded = (...ids: string[]) => ids.map((_id) => ({ _id }) as IMessage);

let mockSearch: Record<string, string> = {};
const wrapper = mockAppRoot()
	.withRouter({ getSearchParameters: () => mockSearch })
	.build();

const loadMessageAround = jest.fn();

type Props = { messages: IMessage[]; isLoading?: boolean; mainMessage?: IThreadMainMessage };
const renderTarget = (search: Record<string, string>, initial: Props = { messages: loaded('main', 'reply-1') }) => {
	mockSearch = search;
	return renderHook(
		({ messages, isLoading = false, mainMessage = main }: Props) =>
			useThreadJumpTarget(mainMessage, messages, { isLoading, loadMessageAround }),
		{ initialProps: initial, wrapper },
	);
};

/** Holds the next request for the replies around a message, and returns what makes it fail. */
const holdNextLoad = () => {
	let fail: (error: Error) => void = () => undefined;
	loadMessageAround.mockReturnValueOnce(
		new Promise((_resolve, reject) => {
			fail = reject;
		}),
	);
	return () => act(async () => fail(new Error('offline')));
};

beforeEach(() => {
	mockSearch = {};
	loadMessageAround.mockReset().mockResolvedValue(undefined);
	jest.mocked(setMessageJumpQueryStringParameter).mockClear();
});

it('gives a loaded reply as the target and clears msg when it is reached (R25)', () => {
	const { result } = renderTarget({ msg: 'reply-1' });

	expect(result.current.targetMessageId).toBe('reply-1');
	expect(loadMessageAround).not.toHaveBeenCalled();

	result.current.onTargetMessageReached('reply-1');
	expect(setMessageJumpQueryStringParameter).toHaveBeenCalledWith(null);
});

it('gives the main message as the target and never clears msg (R26)', () => {
	const { result } = renderTarget({ msg: 'main' });

	expect(result.current.targetMessageId).toBe('main');
	result.current.onTargetMessageReached('main');

	expect(loadMessageAround).not.toHaveBeenCalled();
	expect(setMessageJumpQueryStringParameter).not.toHaveBeenCalled();
});

it('gives no target without msg (R15)', () => {
	const { result } = renderTarget({});

	expect(result.current.targetMessageId).toBeUndefined();
	expect(loadMessageAround).not.toHaveBeenCalled();
});

it('asks once for the replies around a reply that is not loaded, after the first page (R27)', () => {
	const { rerender } = renderTarget({ msg: 'reply-9' }, { messages: [], isLoading: true });
	expect(loadMessageAround).not.toHaveBeenCalled();

	rerender({ messages: loaded('main', 'reply-1'), isLoading: false });
	rerender({ messages: loaded('main', 'reply-1', 'reply-2'), isLoading: false });

	expect(loadMessageAround).toHaveBeenCalledTimes(1);
	expect(loadMessageAround).toHaveBeenCalledWith('reply-9');
});

it('asks for the replies around the main message while older replies remain (R28)', () => {
	renderTarget({ msg: 'main' }, { messages: loaded('reply-50', 'reply-51') });

	expect(loadMessageAround).toHaveBeenCalledWith('main');
});

it('asks again for the same reply once it was reached and the reply left the window (R29)', () => {
	const { result, rerender } = renderTarget({ msg: 'reply-9' }, { messages: loaded('main') });
	expect(loadMessageAround).toHaveBeenCalledTimes(1);

	rerender({ messages: loaded('main', 'reply-9') });
	result.current.onTargetMessageReached('reply-9');
	rerender({ messages: loaded('reply-80') });

	expect(loadMessageAround).toHaveBeenCalledTimes(2);
});

it('asks again for the same reply after msg was cleared and set again (R29)', () => {
	const { rerender } = renderTarget({ msg: 'reply-9' }, { messages: loaded('main') });

	mockSearch = {};
	rerender({ messages: loaded('main') });
	mockSearch = { msg: 'reply-9' };
	rerender({ messages: loaded('main') });

	expect(loadMessageAround).toHaveBeenCalledTimes(2);
});

it('drops a reply that could not be loaded, and asks again when its link is followed again (R30)', async () => {
	loadMessageAround.mockRejectedValue(new Error('offline'));
	const { rerender } = renderTarget({ msg: 'reply-9' }, { messages: loaded('main') });
	await waitFor(() => expect(setMessageJumpQueryStringParameter).toHaveBeenCalledWith(null));

	rerender({ messages: loaded('main', 'reply-1'), isLoading: true });
	rerender({ messages: loaded('main', 'reply-1'), isLoading: false });
	expect(loadMessageAround).toHaveBeenCalledTimes(1);

	mockSearch = {};
	rerender({ messages: loaded('main', 'reply-1') });
	mockSearch = { msg: 'reply-9' };
	rerender({ messages: loaded('main', 'reply-1') });
	expect(loadMessageAround).toHaveBeenCalledTimes(2);
});

it.each([
	['a reply that is not loaded', 'reply-10'],
	['a loaded reply', 'reply-1'],
])('keeps a later link to %s when an earlier one fails to load (R30)', async (_, later) => {
	const failEarlier = holdNextLoad();
	const { rerender } = renderTarget({ msg: 'reply-9' }, { messages: loaded('main', 'reply-1') });

	mockSearch = { msg: later };
	rerender({ messages: loaded('main', 'reply-1') });
	await failEarlier();

	expect(setMessageJumpQueryStringParameter).not.toHaveBeenCalled();
});

it.each([
	['another link was followed', { msg: 'reply-1' }],
	['the link was cleared', {}],
])('keeps a link followed again when its earlier request fails to load, after %s (R30)', async (_, between) => {
	const failEarlier = holdNextLoad();
	const { rerender } = renderTarget({ msg: 'reply-9' }, { messages: loaded('main', 'reply-1') });

	mockSearch = between;
	rerender({ messages: loaded('main', 'reply-1') });
	mockSearch = { msg: 'reply-9' };
	rerender({ messages: loaded('main', 'reply-1') });
	expect(loadMessageAround).toHaveBeenCalledTimes(2);
	await failEarlier();

	expect(setMessageJumpQueryStringParameter).not.toHaveBeenCalled();
});

it('keeps the link when a request of the previous thread fails after the thread changed (R30)', async () => {
	const failEarlier = holdNextLoad();
	const { rerender } = renderTarget({ msg: 'reply-9' }, { messages: loaded('main', 'reply-1') });

	const other = { _id: 'other' } as IThreadMainMessage;
	rerender({ mainMessage: other, messages: loaded('other', 'reply-9') });
	await failEarlier();

	expect(setMessageJumpQueryStringParameter).not.toHaveBeenCalled();
});

it('drops nothing when a request fails after the list is gone (R30)', async () => {
	const failEarlier = holdNextLoad();
	const { unmount } = renderTarget({ msg: 'reply-9' }, { messages: loaded('main', 'reply-1') });

	unmount();
	await failEarlier();

	expect(loadMessageAround).toHaveBeenCalledWith('reply-9');
	expect(setMessageJumpQueryStringParameter).not.toHaveBeenCalled();
});

it('leaves the parameter of a main message that could not be loaded to the room (R30)', async () => {
	loadMessageAround.mockRejectedValue(new Error('offline'));

	renderTarget({ msg: 'main' }, { messages: loaded('reply-50') });
	await new Promise((resolve) => setTimeout(resolve, 0));

	expect(loadMessageAround).toHaveBeenCalledWith('main');
	expect(setMessageJumpQueryStringParameter).not.toHaveBeenCalled();
});
