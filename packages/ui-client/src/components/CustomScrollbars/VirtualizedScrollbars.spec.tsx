import { act, render } from '@testing-library/react';
import type { ReactNode, Ref } from 'react';

import VirtualizedScrollbars from './VirtualizedScrollbars';

const List = ({ scrollerRef, children }: { scrollerRef?: Ref<HTMLDivElement>; children: ReactNode }) => (
	<div ref={scrollerRef}>{children}</div>
);

const RoomList = ({ rooms }: { rooms: string[] }) => (
	<VirtualizedScrollbars>
		<List>
			{rooms.map((room) => (
				<div key={room}>
					<img src={`/avatar/room/${room}`} alt={room} />
				</div>
			))}
		</List>
	</VirtualizedScrollbars>
);

const waitForScrollbarsUpdate = () => act(() => new Promise((resolve) => setTimeout(resolve, 50)));

it('adds no image load listener when a new message moves a room to the top', async () => {
	const { rerender } = render(<RoomList rooms={['general', 'random', 'support']} />);
	await waitForScrollbarsUpdate();

	const addEventListener = jest.spyOn(HTMLImageElement.prototype, 'addEventListener');

	rerender(<RoomList rooms={['support', 'general', 'random']} />);
	await waitForScrollbarsUpdate();

	expect(addEventListener.mock.calls.filter(([type]) => type === 'load')).toHaveLength(0);
});
