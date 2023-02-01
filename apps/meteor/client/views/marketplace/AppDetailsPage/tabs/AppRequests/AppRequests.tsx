import type { App } from '@rocket.chat/core-typings';
import { Box, Pagination, States, StatesSubtitle, StatesTitle } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement, SetStateAction } from 'react';
import React, { useState } from 'react';

import { useAppRequests } from '../../../hooks/useAppRequests';
import { useMarkRequestsAsSeen } from '../../../hooks/useMarkRequestsAsSeen';
import AppRequestItem from './AppRequestItem';
import AppRequestsLoading from './AppRequestsLoading';

type itemsPerPage = 25 | 50 | 100;

const AppRequests = ({ id }: { id: App['id'] }): ReactElement => {
	const [limit, setLimit] = useState<itemsPerPage>(25);
	const [offset, setOffset] = useState<number>(0);

	const { data: paginatedAppRequests, isSuccess, isLoading } = useAppRequests(id, limit, offset);
	useMarkRequestsAsSeen(paginatedAppRequests?.data, isSuccess);
	const t = useTranslation();

	const onSetItemsPerPage = (itemsPerPageOption: SetStateAction<itemsPerPage>) => setLimit(itemsPerPageOption);
	const onSetCurrent = (currentItemsOption: SetStateAction<number>) => setOffset(currentItemsOption);

	if (isLoading) {
		return (
			<Box w='full' maxWidth='x608' marginInline='auto' pbs='x36'>
				<AppRequestsLoading />
			</Box>
		);
	}

	return (
		<Box h='full' display='flex' flexDirection='column'>
			<Box w='full' maxWidth='x608' marginInline='auto' pbs='x36' flexGrow='1'>
				{paginatedAppRequests?.data?.length ? (
					paginatedAppRequests?.data.map((request) => (
						<AppRequestItem
							key={request.id}
							seen={request.seen}
							name={request.requester.name}
							createdDate={request.createdDate}
							message={request.message}
							username={request.requester.username}
						/>
					))
				) : (
					<States>
						<StatesTitle>{t('No_requests')}</StatesTitle>
						<StatesSubtitle>{t('App_requests_by_workspace')}</StatesSubtitle>
					</States>
				)}
			</Box>
			{isSuccess && paginatedAppRequests?.data?.length && (
				<Pagination
					divider
					count={paginatedAppRequests.meta.total}
					itemsPerPage={paginatedAppRequests.meta.limit}
					current={paginatedAppRequests.meta.offset}
					onSetItemsPerPage={onSetItemsPerPage}
					onSetCurrent={onSetCurrent}
				/>
			)}
		</Box>
	);
};

export default AppRequests;
