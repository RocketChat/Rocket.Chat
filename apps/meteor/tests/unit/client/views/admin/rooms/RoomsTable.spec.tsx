import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';
import * as Hooks from '@rocket.chat/fuselage-hooks';
import * as Contexts from '@rocket.chat/ui-contexts';
import * as ReactQuery from '@tanstack/react-query';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { expect } from 'chai';
import React from 'react';
import sinon from 'sinon';

import RoomsTable from '../../../../../../client/views/admin/rooms/RoomsTable';
import { MockedQueryClientWrapper } from '@rocket.chat/mock-providers';


jest.mock('../../../../../../client/views/admin/rooms/RoomRow', () => {
	return ({ someProp }: any) => (
		<tr data-id='RoomRow'>
			<td>MockedRoomRow {someProp}</td>
		</tr>
	);
});

describe('RoomsTable', () => {
	let useQueryStub: any;
	let useEndpointStub: any;
	let useDebouncedValueStub: any;

	beforeEach(() => {
		useEndpointStub = sinon.stub(Contexts, 'useEndpoint').returns(
			sinon.fake(() =>
				Promise.resolve({
					data: { rooms: [], total: 0 },
					isSuccess: true,
					isLoading: false,
					isError: false,
					refetch: sinon.fake(),
				} as never),
			),
		);
		useQueryStub = sinon.stub(ReactQuery, 'useQuery').returns({} as any);
		sinon.stub(Hooks, 'useMediaQuery').returns(true);
		useDebouncedValueStub = sinon.stub(Hooks, 'useDebouncedValue').callsFake((value) => value);
		sinon.stub(Contexts, 'useTranslation').returns({} as any);
		sinon.stub(React, 'memo').returns({} as any);
	});

	afterEach(() => {
		sinon.restore();
	});

	it('renders loading state initially', async () => {
		useQueryStub.returns({
			isLoading: true,
			data: undefined,
			error: undefined,
		});

		render(<RoomsTable reload={{ current: sinon.fake() }} />, { wrapper: MockedQueryClientWrapper() });

		expect(screen.queryByTestId('RoomGenericTableLoadingTable')).not.to.be.undefined;

		sinon.assert.calledOnceWithMatch(
			useQueryStub,
			[
				'rooms',
				{
					filter: '',
					sort: '{ "name": 1 }',
					count: 25,
					offset: 0,
					types: ['d', 'p', 'c', 'l', 'discussions', 'teams'],
				},
				'admin',
			],
			async () => useEndpointStub,
		);

		sinon.restore();
	});

	it('renders no results when data is empty', async () => {
		useQueryStub.returns({
			isLoading: false,
			data: {
				rooms: [],
			},
			error: undefined,
			isSuccess: true,
		});
		render(<RoomsTable reload={{ current: sinon.fake() }} />, { wrapper: MockedQueryClientWrapper() });
		expect(screen.getByText('No_results_found')).to.exist;
		sinon.assert.calledOnceWithMatch(
			useQueryStub,
			[
				'rooms',
				{
					filter: '',
					sort: '{ "name": 1 }',
					count: 25,
					offset: 0,
					types: ['d', 'p', 'c', 'l', 'discussions', 'teams'],
				},
				'admin',
			],
			async () => useEndpointStub,
		);
	});

	it('renders room data when available', async () => {
		useQueryStub.returns({
			data: { rooms: [{ _id: '1', name: 'Room 1', t: RoomType.DIRECT_MESSAGE }], total: 1 },
			isSuccess: true,
			isLoading: false,
			isError: false,
			refetch: sinon.fake(),
		});

		useDebouncedValueStub.returns('Room');

		render(<RoomsTable reload={{ current: sinon.fake() }} />, { wrapper: MockedQueryClientWrapper() });

		expect(screen.queryByTestId('RoomRow')).not.be.undefined;
		expect(screen.queryByTestId('RoomGenericTableLoadingTable')).to.be.null;
		sinon.assert.calledWithMatch(useQueryStub, ['rooms', 'Room', 'admin'], async () => useEndpointStub);
	});

	it('renders error state', async () => {
		useQueryStub.returns({
			data: undefined,
			isSuccess: false,
			isLoading: false,
			isError: true,
			refetch: sinon.fake(),
		});

		render(<RoomsTable reload={{ current: sinon.fake() }} />, { wrapper: MockedQueryClientWrapper() });
		expect(screen.getByText('Something_went_wrong')).not.be.undefined;
		expect(screen.getByText('Reload_page')).not.be.undefined;
		sinon.assert.calledOnceWithMatch(
			useQueryStub,
			[
				'rooms',
				{
					filter: '',
					sort: '{ "name": 1 }',
					count: 25,
					offset: 0,
					types: ['d', 'p', 'c', 'l', 'discussions', 'teams'],
				},
				'admin',
			],
			async () => useEndpointStub,
		);
	});
});
