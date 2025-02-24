import type { App } from '@rocket.chat/core-typings';
import { Box, Pagination, States, StatesSubtitle, StatesTitle } from '@rocket.chat/fuselage';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ReactElement, SetStateAction } from 'react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import AppRequestItem from './AppRequestItem';
import AppRequestsLoading from './AppRequestsLoading';
import { useAppsReload } from '../../../../../contexts/hooks/useAppsReload';
import { useAppRequests } from '../../../hooks/useAppRequests';

type itemsPerPage = 25 | 50 | 100;

const AppRequests = ({ id, isAdminUser }: { id: App['id']; isAdminUser: boolean }): ReactElement => {
	const [limit, setLimit] = useState<itemsPerPage>(25);
	const [offset, setOffset] = useState<number>(0);

	const { isSuccess, data: paginatedAppRequests, isLoading } = useAppRequests(id, limit, offset);
	const { t } = useTranslation();

	const onSetItemsPerPage = (itemsPerPageOption: SetStateAction<itemsPerPage>) => setLimit(itemsPerPageOption);
	const onSetCurrent = (currentItemsOption: SetStateAction<number>) => setOffset(currentItemsOption);

	const reloadApps = useAppsReload();
	const markSeen = useEndpoint('POST', '/apps/app-request/markAsSeen');
	const markAppRequestsAsSeen = useMutation({
		mutationKey: ['mark-app-requests-as-seen'],
		mutationFn: (unseenRequests: Array<string>) => markSeen({ unseenRequests }),
		retry: false,
	});

	const queryClient = useQueryClient();

	useEffect(() => {
		return () => {
			if (isAdminUser && isSuccess) {
				// Marketplace returns data = null if the app was removed, so we need to be sure that the thing
				// we are filtering & mapping is an array
				const unseenRequests = (paginatedAppRequests.data || []).filter(({ seen }) => !seen).map(({ id }) => id);

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
	}, [isAdminUser, isSuccess, paginatedAppRequests?.data, reloadApps]);

	if (isLoading) {
		return (
			<Box w='full' maxWidth='x608' marginInline='auto' pbs={36}>
				<AppRequestsLoading />
			</Box>
		);
	}

	return (
		<Box h='full' display='flex' flexDirection='column'>
			<Box w='full' maxWidth='x608' marginInline='auto' pbs={36} flexGrow='1'>
				{isSuccess && paginatedAppRequests.data?.length ? (
					paginatedAppRequests.data.map((request) => (
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
			{isSuccess && paginatedAppRequests.data?.length && (
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
