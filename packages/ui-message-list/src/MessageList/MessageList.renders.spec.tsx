import type { IMessage } from '@rocket.chat/core-typings';
import { createFakeMessage, mockAppRoot } from '@rocket.chat/mock-providers';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';

import type { MessageListHandle, MessageListProps } from './MessageList';
import MessageList from './MessageList';
import { useIsMessageEmphasized } from '../Message/hooks/useIsMessageEmphasized';

jest.mock('./MessageListVirtualizer', () => jest.requireActual('./MessageListRows'));

const wrapper = mockAppRoot().build();

const day = (date: number, hours = 10) => new Date(2024, 0, date, hours);
const author = { _id: 'alice', username: 'alice', name: 'Alice' };

const messages = ['a', 'b', 'c', 'd'].map((_id, index) => createFakeMessage({ _id, msg: _id, ts: day(15, 10 + index), u: author }));

const renders = new Map<string, number>();

const Row = ({ message }: { message: IMessage }) => {
	useIsMessageEmphasized(message._id);
	renders.set(message._id, (renders.get(message._id) ?? 0) + 1);
	return <div role='listitem'>{message.msg}</div>;
};

const renderMessage: MessageListProps<IMessage>['renderMessage'] = (row) => <Row message={row.message} />;

const List = (props: Partial<MessageListProps<IMessage>>) => (
	<MessageList<IMessage> aria-label='Message list' messages={messages} renderMessage={renderMessage} {...props} />
);

const rendered = () => Object.fromEntries(renders);

beforeEach(() => renders.clear());

afterEach(() => jest.useRealTimers());

describe('what a change renders', () => {
	it('does not render rows for a change of its own scroll state (R71)', () => {
		const ref = createRef<MessageListHandle>();
		render(<List ref={ref} />, { wrapper });
		renders.clear();

		fireEvent.wheel(screen.getByRole('list'));
		act(() => ref.current?.scrollToTop());
		act(() => ref.current?.scrollToBottom());

		expect(rendered()).toEqual({});
	});

	it('renders only the new row when a message arrives (R72)', () => {
		const { rerender } = render(<List messages={messages.slice(0, 3)} />, { wrapper });
		renders.clear();

		rerender(<List messages={messages} />);

		expect(rendered()).toEqual({ d: 1 });
	});

	it('renders the rows whose grouping, day or unread divider changed, and no other (R72)', () => {
		const { rerender } = render(<List />, { wrapper });
		renders.clear();

		rerender(<List firstUnreadMessageId='c' />);

		expect(rendered()).toEqual({ c: 1 });
	});

	it('renders the rows whose grouping changed with the grouping period (R72)', () => {
		const minutes = ['a', 'b', 'c'].map((_id, index) =>
			createFakeMessage({ _id, msg: _id, ts: new Date(2024, 0, 15, 10, index), u: author }),
		);
		const { rerender } = render(<List messages={minutes} />, { wrapper });
		renders.clear();

		rerender(<List messages={minutes} groupingPeriodSeconds={30} />);

		expect(rendered()).toEqual({ b: 1, c: 1 });
	});

	it('renders the new row and the one whose neighbour changed when older messages are added before them (R72)', () => {
		const older = createFakeMessage({ _id: 'z', msg: 'z', ts: day(15, 8), u: author });
		const { rerender } = render(<List />, { wrapper });
		renders.clear();

		rerender(<List messages={[older, ...messages]} />);

		expect(rendered()).toEqual({ z: 1, a: 1 });
	});

	it('renders each row at most once more when a highlight starts and ends (R73)', () => {
		jest.useFakeTimers();
		const { rerender } = render(<List />, { wrapper });
		renders.clear();

		rerender(<List targetMessageId='b' />);
		expect(Object.values(rendered()).every((count) => count <= 1)).toBe(true);

		renders.clear();
		act(() => jest.advanceTimersByTime(2000));
		expect(Object.values(rendered()).every((count) => count <= 1)).toBe(true);
	});
});
