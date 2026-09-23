import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { render } from '@testing-library/react';
import type { TFunction } from 'i18next';

import RoomListRow from './RoomListRow';
import type { RoomListCallActions } from '../contexts/RoomListContext';

let renders = 0;

jest.mock('./SidebarItemTemplateWithData', () => ({
	__esModule: true,
	default: () => {
		renders += 1;
		return null;
	},
}));

const ROWS = 10;

const data = {
	extended: false,
	t: ((key: string) => key) as unknown as TFunction,
	SidebarItemTemplate: (() => null) as never,
	AvatarTemplate: null,
	formatTime: () => '',
	isPriorityEnabled: false,
	openedRoom: '',
	sidebarViewMode: 'condensed' as const,
	isAnonymous: false,
	userId: 'uid',
};

const rooms = Array.from({ length: ROWS }, (_, i) => ({ _id: `rid-${i}`, rid: `rid-${i}`, t: 'c' }) as SubscriptionWithRoom);

const List = ({ ringing }: { ringing: ReadonlyMap<string, RoomListCallActions> }) => (
	<>
		{rooms.map((room) => (
			<RoomListRow key={room.rid} data={data} item={room} videoConfActions={ringing.get(room.rid)} />
		))}
	</>
);

describe('RoomListRow', () => {
	beforeEach(() => {
		renders = 0;
	});

	it('redraws only the room whose call started ringing', () => {
		const { rerender } = render(<List ringing={new Map()} />);
		expect(renders).toBe(ROWS);

		renders = 0;
		const ringing = new Map<string, RoomListCallActions>([['rid-3', { acceptCall: () => undefined, rejectCall: () => undefined }]]);
		rerender(<List ringing={ringing} />);

		expect(renders).toBe(1);
	});

	it('redraws nothing while no call comes or goes', () => {
		const ringing = new Map<string, RoomListCallActions>();

		const { rerender } = render(<List ringing={ringing} />);
		renders = 0;

		rerender(<List ringing={ringing} />);

		expect(renders).toBe(0);
	});
});
