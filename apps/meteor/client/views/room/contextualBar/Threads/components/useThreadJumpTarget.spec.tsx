import type { IMessage, IThreadMainMessage } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook } from '@testing-library/react';

import { useThreadJumpTarget } from './useThreadJumpTarget';
import { setMessageJumpQueryStringParameter } from '../../../../../lib/utils/setMessageJumpQueryStringParameter';

jest.mock('../../../../../lib/utils/setMessageJumpQueryStringParameter', () => ({ setMessageJumpQueryStringParameter: jest.fn() }));

const mainMessage = { _id: 'thread-id' } as IThreadMainMessage;

const renderJumpTarget = (msg: string, loaded: Pick<IMessage, '_id'>[], loadMessageAround = jest.fn().mockResolvedValue(undefined)) =>
	renderHook(() => useThreadJumpTarget(mainMessage, loaded as IMessage[], { isLoading: false, loadMessageAround }), {
		wrapper: mockAppRoot()
			.withRouter({ getSearchParameters: () => ({ msg }) })
			.build(),
	});

afterEach(() => {
	jest.clearAllMocks();
});

it('loads the replies around a linked reply once, while it is not loaded', () => {
	const loadMessageAround = jest.fn().mockResolvedValue(undefined);

	const { rerender } = renderJumpTarget('reply-9', [], loadMessageAround);
	rerender();

	expect(loadMessageAround).toHaveBeenCalledTimes(1);
	expect(loadMessageAround).toHaveBeenCalledWith('reply-9');
});

it('does not load anything for the main message', () => {
	const loadMessageAround = jest.fn().mockResolvedValue(undefined);

	renderJumpTarget('thread-id', [], loadMessageAround);

	expect(loadMessageAround).not.toHaveBeenCalled();
});

it('clears the search parameter once a reply is reached, and keeps it for the main message', () => {
	const { result } = renderJumpTarget('reply-1', [{ _id: 'reply-1' }]);
	result.current.onTargetMessageReached('reply-1');
	expect(setMessageJumpQueryStringParameter).toHaveBeenCalledWith(null);

	jest.clearAllMocks();

	const { result: main } = renderJumpTarget('thread-id', [{ _id: 'thread-id' }]);
	main.current.onTargetMessageReached('thread-id');
	expect(setMessageJumpQueryStringParameter).not.toHaveBeenCalled();
});
