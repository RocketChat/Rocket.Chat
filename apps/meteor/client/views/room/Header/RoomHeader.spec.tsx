import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import RoomHeader from './RoomHeader';
import FakeRoomProvider from '../../../../tests/mocks/client/FakeRoomProvider';
import { createFakeRoom } from '../../../../tests/mocks/data';

const mockedRoom = createFakeRoom({ prid: undefined });
const appRoot = mockAppRoot()
	.withRoom(mockedRoom)
	.wrap((children) => <FakeRoomProvider roomOverrides={mockedRoom}>{children}</FakeRoomProvider>)
	.build();

jest.mock('../../../../app/utils/client', () => ({
	getURL: (url: string) => url,
}));

jest.mock('./ParentRoom', () => ({
	__esModule: true,
	default: jest.fn(() => <div>ParentRoom</div>),
}));

jest.mock('./RoomToolbox', () => ({
	__esModule: true,
	default: jest.fn(() => <div>RoomToolbox</div>),
}));

describe('RoomHeader', () => {
	describe('Toolbox', () => {
		it('should render toolbox by default', async () => {
			render(<RoomHeader room={mockedRoom} slots={{}} />, { wrapper: appRoot });
			expect(screen.getByLabelText('Toolbox_room_actions')).toBeInTheDocument();
		});

		it('should not render toolbox if roomToolbox is null and no slots are provided', () => {
			render(
				<RoomHeader
					room={mockedRoom}
					slots={{
						toolbox: {
							hidden: true,
						},
					}}
				/>,
				{ wrapper: appRoot },
			);
			expect(screen.queryByLabelText('Toolbox_room_actions')).not.toBeInTheDocument();
		});

		it('should render toolbox if slots.toolbox is provided', () => {
			render(<RoomHeader room={mockedRoom} slots={{ toolbox: {} }} />, { wrapper: appRoot });
			expect(screen.getByLabelText('Toolbox_room_actions')).toBeInTheDocument();
		});

		it('should render custom toolbox content from roomToolbox prop', () => {
			render(<RoomHeader room={mockedRoom} slots={{ toolbox: { content: <div>Custom Toolbox</div> } }} />, { wrapper: appRoot });
			expect(screen.getByText('Custom Toolbox')).toBeInTheDocument();
		});

		it('should render custom toolbox content from slots.toolbox.content', () => {
			render(<RoomHeader room={mockedRoom} slots={{ toolbox: { content: <div>Slotted Toolbox</div> } }} />, { wrapper: appRoot });
			expect(screen.getByText('Slotted Toolbox')).toBeInTheDocument();
		});
	});
});
