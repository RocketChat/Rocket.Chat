import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, render, screen } from '@testing-library/react';

import MessagesProvider from './MessagesProvider';
import RelatedDataReader, { relatedDataReads } from '../../../tests/mocks/client/RelatedDataReader';
import { createFakeMessage, createFakeRoom, createFakeSubscription } from '../../../tests/mocks/data';
import { Messages } from '../../stores';

jest.mock('../../../rocketchat.info', () => ({ Info: {} }));
jest.mock('../../lib/rooms/roomCoordinator', () => ({ roomCoordinator: { isLivechatRoom: () => false } }));

const wrapper = mockAppRoot().withJohnDoe().build();
const message = createFakeMessage({ _id: 'mid', rid: 'room-id', u: { _id: 'author', username: 'author' } });
const room = createFakeRoom({ _id: 'room-id', t: 'c', topic: 'first topic' });
const subscription = createFakeSubscription({ rid: 'room-id', unread: 0, alert: false });

type Kind = keyof typeof relatedDataReads;
const kinds = Object.keys(relatedDataReads) as Kind[];

const renderPlace = () => {
	const shown = Object.fromEntries(kinds.map((kind) => [kind, [] as string[]])) as Record<Kind, string[]>;
	const readers = kinds.map((kind) => (
		<RelatedDataReader key={kind} message={message} read={relatedDataReads[kind]} onRender={(text) => shown[kind].push(text)} />
	));
	const tree = (placeRoom = room, placeSubscription = subscription) => (
		<MessagesProvider room={placeRoom} subscription={placeSubscription}>
			{readers}
		</MessagesProvider>
	);
	const renders = () => Object.fromEntries(kinds.map((kind) => [kind, shown[kind].length])) as Record<Kind, number>;

	return { ...render(tree(), { wrapper }), tree, shown, renders };
};

afterEach(() => Messages.state.replaceAll([]));

it('does not render the readers of a mounted row when a message arrives (R49)', () => {
	const { rerender, tree, renders } = renderPlace();
	const before = renders();

	act(() => {
		Messages.state.store(createFakeMessage({ _id: 'arrived', rid: 'room-id' }));
	});
	rerender(
		tree(
			{ ...room, lm: new Date(), msgs: 10, lastMessage: createFakeMessage({ _id: 'arrived', rid: 'room-id' }) },
			{ ...subscription, ls: new Date(), lr: new Date(), unread: 2, alert: true, tunread: ['arrived'] },
		),
	);

	expect({ collapsed: renders().collapsed, roles: renders().roles, broadcast: renders().broadcast }).toEqual({
		collapsed: before.collapsed,
		roles: before.roles,
		broadcast: before.broadcast,
	});
});

it('gives a selecting reader the current conversation and renders it when what it selects changes (R50)', () => {
	const { rerender, tree, shown } = renderPlace();
	expect(screen.getByText('broadcast: false')).toBeInTheDocument();
	expect(screen.getByText('topic: first topic')).toBeInTheDocument();

	rerender(tree({ ...room, topic: 'second topic' }, subscription));

	expect(screen.getByText('topic: second topic')).toBeInTheDocument();
	expect(shown.conversation).toEqual(['topic: first topic', 'topic: second topic']);
	expect(shown.broadcast).toEqual(['broadcast: false']);

	rerender(tree({ ...room, topic: 'second topic' }, { ...subscription, broadcast: true }));

	expect(shown.broadcast).toEqual(['broadcast: false', 'broadcast: true']);
	expect(screen.getByText('broadcast: true')).toBeInTheDocument();
});

it('does not render readers for an equal copy of the room or the subscription (R51)', () => {
	const { rerender, tree, renders } = renderPlace();
	const before = renders();

	rerender(tree({ ...room }, { ...subscription }));

	expect(renders()).toEqual(before);
});
