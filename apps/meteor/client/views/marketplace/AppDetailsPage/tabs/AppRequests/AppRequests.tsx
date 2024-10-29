import type { App } from '@rocket.chat/core-typings';
import { Box, Pagination, States, StatesSubtitle, StatesTitle } from '@rocket.chat/fuselage';
import { useEndpoint, usePermission } from '@rocket.chat/ui-contexts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import AppRequestItem from './AppRequestItem';
import AppRequestsLoading from './AppRequestsLoading';
import { useAppRequestsQuery } from '../../../hooks/useAppRequestsQuery';
import { usePaginationState } from '../../../hooks/usePaginationState';

const useMarkAppRequestsAsSeenMutation = () => {
	const markSeen = useEndpoint('POST', '/apps/app-request/markAsSeen');
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (unseenRequests: string[]) => {
			if (unseenRequests.length === 0) {
				return;
			}

			return markSeen({ unseenRequests });
		},
		retry: false,
		onSuccess: () => {
			queryClient.refetchQueries({ queryKey: ['app-requests-stats'] });
			queryClient.invalidateQueries(['marketplace']);
		},
	});
};

type AppRequestsProps = {
	appId: App['id'];
};

const AppRequests = ({ appId }: AppRequestsProps) => {
	const canManageApps = usePermission('manage-apps');

	const { current, itemsPerPage, onSetCurrent, onSetItemsPerPage } = usePaginationState();

	const { isLoading, isSuccess, data } = useAppRequestsQuery(appId, { limit: itemsPerPage, offset: current });
	const { t } = useTranslation();

	const { mutate } = useMarkAppRequestsAsSeenMutation();

	useEffect(() => {
		if (!canManageApps || !isSuccess) {
			return;
		}

		const unseenRequests = data.data.filter(({ seen }) => !seen).map(({ id }) => id);

		const timeout = setTimeout(() => {
			mutate(unseenRequests);
		}, 1000);

		return () => {
			clearTimeout(timeout);
		};
	}, [canManageApps, data?.data, isSuccess, mutate]);

	if (isLoading) {
		return (
			<Box w='full' maxWidth='x608' marginInline='auto' pbs={36}>
				<AppRequestsLoading />
			</Box>
		);
	}

	if (!isSuccess || !data.data.length) {
		return (
			<Box h='full' display='flex' flexDirection='column'>
				<Box w='full' maxWidth='x608' marginInline='auto' pbs={36} flexGrow='1'>
					<States>
						<StatesTitle>{t('No_requests')}</StatesTitle>
						<StatesSubtitle>{t('App_requests_by_workspace')}</StatesSubtitle>
					</States>
				</Box>
			</Box>
		);
	}

	return (
		<Box h='full' display='flex' flexDirection='column'>
			<Box w='full' maxWidth='x608' marginInline='auto' pbs={36} flexGrow='1'>
				{data.data.map((request) => (
					<AppRequestItem
						key={request.id}
						seen={request.seen}
						name={request.requester.name}
						createdDate={request.createdDate}
						message={request.message}
						username={request.requester.username}
					/>
				))}
			</Box>
			<Pagination
				divider
				count={data.meta.total}
				itemsPerPage={itemsPerPage}
				current={current}
				onSetItemsPerPage={onSetItemsPerPage}
				onSetCurrent={onSetCurrent}
				itemsPerPageLabel={() => t('Items_per_page:')}
				showingResultsLabel={({ count, current, itemsPerPage }) =>
					t('Showing_results_of', { postProcess: 'sprintf', sprintf: [current + 1, Math.min(current + itemsPerPage, count), count] })
				}
			/>
		</Box>
	);
};

export default AppRequests;
