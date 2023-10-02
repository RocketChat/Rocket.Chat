import type { App } from '@rocket.chat/core-typings';
import { Box, Pagination, States, StatesSubtitle, StatesTitle } from '@rocket.chat/fuselage';
import { useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import type { ReactElement, SetStateAction } from 'react';
import React, { useState, useEffect } from 'react';

import { useAppsReload } from '../../../../../contexts/hooks/useAppsReload';
import { queryClient } from '../../../../../lib/queryClient';
import { useAppRequests } from '../../../hooks/useAppRequests';
import AppRequestItem from './AppRequestItem';
import AppRequestsLoading from './AppRequestsLoading';

type itemsPerPage = 25 | 50 | 100;

const AppRequests = ({ id, isAdminUser }: { id: App['id']; isAdminUser: boolean }): ReactElement => {
	const [limit, setLimit] = useState<itemsPerPage>(25);
	const [offset, setOffset] = useState<number>(0);

	const paginatedAppRequests = useAppRequests(id, limit, offset);
	const t = useTranslation();

	const onSetItemsPerPage = (itemsPerPageOption: SetStateAction<itemsPerPage>) => setLimit(itemsPerPageOption);
	const onSetCurrent = (currentItemsOption: SetStateAction<number>) => setOffset(currentItemsOption);

	const reloadApps = useAppsReload();
	const markSeen = useEndpoint('POST', '/apps/app-request/markAsSeen');
	const markAppRequestsAsSeen = useMutation({
		mutationKey: ['mark-app-requests-as-seen'],
		mutationFn: (unseenRequests: Array<string>) => markSeen({ unseenRequests }),
		retry: false,
	});
	useEffect(() => {
		return () => {
			if (isAdminUser && paginatedAppRequests.isSuccess) {
				const unseenRequests = paginatedAppRequests.data.data.filter(({ seen }) => !seen).map(({ id }) => id);

				if (unseenRequests.length) {
					markAppRequestsAsSeen.mutate(unseenRequests, {
						onSuccess: () => {
							queryClient.refetchQueries({ queryKey: ['app-requests-stats'] });
							reloadApps();
						},
					});
				}
			}
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isAdminUser, paginatedAppRequests.isSuccess, paginatedAppRequests?.data, reloadApps]);

	if (paginatedAppRequests.isLoading) {
		return (
			<Box w='full' maxWidth='x608' marginInline='auto' pbs={36}>
				<AppRequestsLoading />
			</Box>
		);
	}

	return (
		<Box h='full' display='flex' flexDirection='column'>
			<Box w='full' maxWidth='x608' marginInline='auto' pbs={36} flexGrow='1'>
				{paginatedAppRequests.isSuccess && paginatedAppRequests.data.data?.length ? (
					paginatedAppRequests.data.data.map((request) => (
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
			{paginatedAppRequests.isSuccess && paginatedAppRequests.data.data?.length && (
				<Pagination
					divider
					count={paginatedAppRequests.data.meta.total}
					itemsPerPage={paginatedAppRequests.data.meta.limit}
					current={paginatedAppRequests.data.meta.offset}
					onSetItemsPerPage={onSetItemsPerPage}
					onSetCurrent={onSetCurrent}
				/>
			)}
		</Box>
	);
};

export default AppRequests;
