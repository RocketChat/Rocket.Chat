/* eslint-disable no-restricted-properties */
import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';
import * as Hooks from '@rocket.chat/fuselage-hooks';
import * as Contexts from '@rocket.chat/ui-contexts';
import * as ReactQuery from '@tanstack/react-query';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { expect } from 'chai';
import React from 'react';
import sinon from 'sinon';

import RoomsTable from '../../../../../../client/views/admin/rooms/RoomsTable';

jest.mock('../../../../../../client/views/admin/rooms/RoomRow', () => {
	return ({ someProp }: any) => <div data-id='RoomRow'>MockedRoomRow {someProp}</div>;
});

const createQueryClientWrapper = () => {
	const queryClient = new QueryClient();
	const provider = ({ children }: any) => {
		return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
	};
	provider.displayName = 'provider';

	return provider;
};

describe('RoomsTable', () => {
	let useQueryStub: any;

	beforeEach(() => {
		sinon.stub(Contexts, 'useEndpoint').returns(
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
		sinon.stub(Hooks, 'useLocalStorage').returns([[], sinon.fake()]);
		sinon.stub(Hooks, 'useDebouncedValue').callsFake((value) => value);
		sinon.stub(Contexts, 'useTranslation').returns({} as any);
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

		render(<RoomsTable reload={{ current: sinon.fake() }} />, { wrapper: createQueryClientWrapper() });

		expect(screen.queryByTestId('RoomGenericTableLoadingTable')).not.to.be.undefined;

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
		render(<RoomsTable reload={{ current: sinon.fake() }} />, { wrapper: createQueryClientWrapper() });
		expect(screen.getByText('No_results_found')).to.exist;
	});

	it('renders room data when available', async () => {
		useQueryStub.returns({
			data: { rooms: [{ _id: '1', name: 'Room 1', t: RoomType.DIRECT_MESSAGE }], total: 1 },
			isSuccess: true,
			isLoading: false,
			isError: false,
			refetch: sinon.fake(),
		});

		render(<RoomsTable reload={{ current: sinon.fake() }} />, { wrapper: createQueryClientWrapper() });

		expect(screen.queryByTestId('RoomRow')).not.be.undefined;
		expect(screen.queryByTestId('RoomGenericTableLoadingTable')).to.be.null;
	});

	it('renders error state', async () => {
		useQueryStub.returns({
			data: undefined,
			isSuccess: false,
			isLoading: false,
			isError: true,
			refetch: sinon.fake(),
		});

		render(<RoomsTable reload={{ current: sinon.fake() }} />, { wrapper: createQueryClientWrapper() });
		expect(screen.getByText('Something_went_wrong')).not.be.undefined;
		expect(screen.getByText('Reload_page')).not.be.undefined;
	});
});
