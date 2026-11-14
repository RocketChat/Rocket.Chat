import type { IMessage } from '@rocket.chat/core-typings';
import { createFakeMessage, mockAppRoot } from '@rocket.chat/mock-providers';
import { render } from '@testing-library/react';
import type { ComponentProps } from 'react';

import MessageList from './MessageList';
import type { MessageListProps } from './MessageList';
import { MessageEditingContext } from '../Message/contexts/MessageEditingContext';
import { createMessageSelectionStore, MessageSelectionContext } from '../Message/contexts/MessageSelectionContext';

const mockVirtualizerProps = jest.fn();

jest.mock('./MessageListVirtualizer', () => {
	const Rows = jest.requireActual('./MessageListRows').default;
	return {
		__esModule: true,
		default: (props: ComponentProps<typeof Rows>) => {
			mockVirtualizerProps(props);
			return <Rows {...props} />;
		},
	};
});

const wrapper = mockAppRoot().build();

const file = { _id: 'f', name: 'f.txt', type: 'text/plain', size: 1, format: 'txt' };
const messages = [
	createFakeMessage({ _id: 'a', ts: new Date(2024, 0, 14), files: [file] }),
	createFakeMessage({ _id: 'b', ts: new Date(2024, 0, 14, 0, 1) }),
	createFakeMessage({ _id: 'c', ts: new Date(2024, 0, 14, 0, 2), urls: [{ url: 'https://example.com', meta: { pageTitle: 'Example' } }] }),
	createFakeMessage({ _id: 'd', ts: new Date(2024, 0, 14, 0, 3), urls: [{ url: 'https://example.com', meta: {} }] }),
];

const List = (props: Partial<MessageListProps<IMessage>>) => (
	<MessageList<IMessage> aria-label='Message list' messages={messages} renderMessage={(row) => <p>{row.message._id}</p>} {...props} />
);

const lastKeepMounted = () => mockVirtualizerProps.mock.lastCall?.[0].keepMounted;

beforeEach(() => mockVirtualizerProps.mockClear());

describe('the rows kept mounted', () => {
	it('keeps the messages with a live embed mounted and no other (R64)', () => {
		render(<List />, { wrapper });

		expect(lastKeepMounted()).toEqual([0, 2]);
	});

	it('keeps the right messages mounted with a loader or the header among the rows (R42)', () => {
		const { rerender } = render(<List hasOlderMessages hasNewerMessages />, { wrapper });
		expect(lastKeepMounted()).toEqual([1, 3]);

		rerender(<List header={<p>Start</p>} />);
		expect(lastKeepMounted()).toEqual([1, 3]);
	});

	it('keeps mounted what the consumer asks for (R64)', () => {
		render(<List shouldKeepMounted={(message) => message._id === 'b'} />, { wrapper });

		expect(lastKeepMounted()).toEqual([1]);
	});

	it('keeps the row it holds in view mounted, and no row for another state of the interface (R65)', () => {
		const store = createMessageSelectionStore({ isSelecting: true });
		const { rerender } = render(
			<MessageEditingContext.Provider value='b'>
				<MessageSelectionContext.Provider value={store}>
					<List shouldKeepMounted={() => false} />
				</MessageSelectionContext.Provider>
			</MessageEditingContext.Provider>,
			{ wrapper },
		);
		store.toggle('b');
		expect(lastKeepMounted()).toEqual([]);

		rerender(
			<MessageEditingContext.Provider value='b'>
				<MessageSelectionContext.Provider value={store}>
					<List shouldKeepMounted={() => false} targetMessageId='b' hasOlderMessages />
				</MessageSelectionContext.Provider>
			</MessageEditingContext.Provider>,
		);
		expect(lastKeepMounted()).toEqual([2]);
	});
});

describe('the top message', () => {
	it('is never a header or a loader (R42)', () => {
		const onVisibleMessagesChange = jest.fn();

		render(<List hasOlderMessages onVisibleMessagesChange={onVisibleMessagesChange} />, { wrapper });

		expect(onVisibleMessagesChange).toHaveBeenCalledWith(expect.objectContaining({ topMessage: messages[0] }));
	});
});
