import type { App } from '@rocket.chat/core-typings';
import { Box, Pagination } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import React from 'react';

import { useAppRequests } from '../../../hooks/useAppRequests';
import AppRequestItem from './AppRequestItem';
import AppRequestsLoading from './AppRequestsLoading';

const AppRequests = ({ id }: { id: App['id'] }): ReactElement => {
	const appRequests = useAppRequests(id);

	if (appRequests.isLoading) {
		return (
			<Box w='full' maxWidth='x608' marginInline='auto' pbs='x36'>
				<AppRequestsLoading />
			</Box>
		);
	}

	return (
		<Box h='full' display='flex' flexDirection='column'>
			<Box w='full' maxWidth='x608' marginInline='auto' pbs='x36' flexGrow='1'>
				{appRequests.data?.data.map((request) => (
					<AppRequestItem seen={request.seen} name={request.requester.name} createdDate={request.createdDate} message={request.message} />
				))}
			</Box>
			{appRequests.isSuccess && (
				<Pagination
					divider
					count={appRequests.data.meta.total}
					itemsPerPage={appRequests.data.meta.limit}
					current={appRequests.data.meta.offset}
				/>
			)}
		</Box>
	);
};

export default AppRequests;
