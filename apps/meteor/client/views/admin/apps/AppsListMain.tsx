import { Box, Pagination, Skeleton } from '@rocket.chat/fuselage';
import colors from '@rocket.chat/fuselage-tokens/colors';
import React from 'react';
import AppRow from './AppRow';
import { AsyncState, AsyncStatePhase } from '/client/lib/asyncState';
import { App } from '@rocket.chat/core-typings';

type itemsPerPage = 25 | 50 | 100;

type AppsListMainProps = {
    appsResult: AsyncState<{
        items: App[];
    } & {
        shouldShowSearchText: boolean;
    } & {
        count: number;
        offset: number;
        total: number;
    }>;
    current: number;
    itemsPerPage: itemsPerPage;
    onSetItemsPerPage: React.Dispatch<React.SetStateAction<itemsPerPage>>;
    onSetCurrent: React.Dispatch<React.SetStateAction<number>>;
    paginationProps: {
        itemsPerPageLabel: () => string;
        showingResultsLabel: (context: {
            count: number;
            current: number;
            itemsPerPage: itemsPerPage;
        }) => string;
    };
    isMarketplace: boolean;
};

const AppsListMain = ({ appsResult, current, itemsPerPage, onSetItemsPerPage, onSetCurrent, paginationProps, isMarketplace }: AppsListMainProps) => {
	const loadingRows = Array.from({ length: 8 }, (_, i) => <Skeleton key={i} height='x56' mbe='x8' width='100%' variant='rect' />);

	return (
		<>
			<Box overflowY='auto' height='100%'>
				{appsResult.phase === AsyncStatePhase.LOADING
					? loadingRows
					: appsResult.phase === AsyncStatePhase.RESOLVED &&
					  appsResult.value.items.map((app) => <AppRow key={app.id} isMarketplace={isMarketplace} {...app} />)}
			</Box>
			{appsResult.phase === AsyncStatePhase.RESOLVED && (
				<Pagination
					current={current}
					itemsPerPage={itemsPerPage}
					count={appsResult.value.total}
					onSetItemsPerPage={onSetItemsPerPage}
					onSetCurrent={onSetCurrent}
					borderBlockStart={`2px solid ${colors.n300}`}
					{...paginationProps}
				/>
			)}
		</>
	);
};

export default AppsListMain;
