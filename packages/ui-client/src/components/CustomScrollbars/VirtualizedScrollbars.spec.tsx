import { act, render, screen } from '@testing-library/react';
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
					<img className='rcx-avatar__element' src={`/avatar/room/${room}`} alt={room} />
				</div>
			))}
		</List>
	</VirtualizedScrollbars>
);

const waitForScrollbarsUpdate = () => act(() => new Promise((resolve) => setTimeout(resolve, 50)));

const trackLoadListeners = (img: HTMLImageElement) => {
	const added = jest.spyOn(img, 'addEventListener');
	const removed = jest.spyOn(img, 'removeEventListener');
	const countLoad = (spy: typeof added | typeof removed) => spy.mock.calls.filter(([type]) => type === 'load').length;
	return () => countLoad(added) - countLoad(removed);
};

it('keeps the load listeners of a room avatar constant while new messages move rooms to the top', async () => {
	let rooms = ['general', 'random', 'support'];
	const { rerender } = render(<RoomList rooms={rooms} />);
	await waitForScrollbarsUpdate();

	const liveLoadListeners = trackLoadListeners(screen.getByAltText<HTMLImageElement>('support'));

	for (let message = 0; message < 10; message++) {
		const [top, ...others] = rooms;
		rooms = [...others, top];
		rerender(<RoomList rooms={rooms} />);
		// eslint-disable-next-line no-await-in-loop
		await waitForScrollbarsUpdate();
	}

	expect(liveLoadListeners()).toBe(0);
});
