import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render } from '@testing-library/react';

import RoomHeader from './RoomHeader';
import FakeRoomProvider from '../../../../tests/mocks/client/FakeRoomProvider';
import { createFakeRoom } from '../../../../tests/mocks/data';

const mockedRoom = createFakeRoom({ t: 'p', prid: undefined });
const appRoot = mockAppRoot()
	.withRoom(mockedRoom)
	.wrap((children) => <FakeRoomProvider roomOverrides={mockedRoom}>{children}</FakeRoomProvider>)
	.build();

jest.mock('../../../../app/utils/client', () => ({
	getURL: (url: string) => url,
}));

jest.mock('./ParentRoomWithData', () => ({
	__esModule: true,
	default: jest.fn(() => <div>ParentRoomWithData</div>),
}));

jest.mock('./ParentTeam', () => ({
	__esModule: true,
	default: jest.fn(() => <div>ParentTeam</div>),
}));

jest.mock('./RoomToolbox', () => ({
	__esModule: true,
	default: jest.fn(() => <div>RoomToolbox</div>),
}));

describe('RoomHeader', () => {
	describe('Toolbox', () => {
		it('should render toolbox by default', async () => {
			const { baseElement } = render(<RoomHeader room={mockedRoom} slots={{}} />, { wrapper: appRoot });
			expect(baseElement).toMatchSnapshot();
		});

		it('should not render toolbox if roomToolbox is null and no slots are provided', () => {
			const { baseElement } = render(<RoomHeader room={mockedRoom} slots={{}} roomToolbox={null} />, { wrapper: appRoot });
			expect(baseElement).toMatchSnapshot();
		});

		it('should render toolbox if slots.toolbox is provided', () => {
			const { baseElement } = render(<RoomHeader room={mockedRoom} slots={{ toolbox: {} }} roomToolbox={null} />, { wrapper: appRoot });
			expect(baseElement).toMatchSnapshot();
		});

		it('should render custom toolbox content from roomToolbox prop', () => {
			const { baseElement } = render(<RoomHeader room={mockedRoom} slots={{}} roomToolbox={<div>Custom Toolbox</div>} />, {
				wrapper: appRoot,
			});
			expect(baseElement).toMatchSnapshot();
		});

		it('should render custom toolbox content from slots.toolbox.content', () => {
			const { baseElement } = render(<RoomHeader room={mockedRoom} slots={{ toolbox: { content: <div>Slotted Toolbox</div> } }} />, {
				wrapper: appRoot,
			});
			expect(baseElement).toMatchSnapshot();
		});

		it('should prioritize slots.toolbox.content over roomToolbox', () => {
			const { baseElement } = render(
				<RoomHeader
					room={mockedRoom}
					roomToolbox={<div>Custom Toolbox</div>}
					slots={{ toolbox: { content: <div>Slotted Toolbox</div> } }}
				/>,
				{ wrapper: appRoot },
			);
			expect(baseElement).toMatchSnapshot();
		});
	});
});
