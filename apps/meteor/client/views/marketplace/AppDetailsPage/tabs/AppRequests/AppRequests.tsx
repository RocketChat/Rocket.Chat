import type { App } from '@rocket.chat/core-typings';
import { Box, Pagination, States, StatesSubtitle, StatesTitle } from '@rocket.chat/fuselage';
import { usePermission } from '@rocket.chat/ui-contexts';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import AppRequestItem from './AppRequestItem';
import AppRequestsLoading from './AppRequestsLoading';
import { useMarkAppRequestsAsSeenMutation } from './useMarkAppRequestsAsSeenMutation';
import { useAppRequestsQuery } from '../../../hooks/useAppRequestsQuery';
import { usePaginationState } from '../../../hooks/usePaginationState';

type AppRequestsProps = {
	appId: App['id'];
};

const AppRequests = ({ appId }: AppRequestsProps) => {
	const canManageApps = usePermission('manage-apps');

	const { current, itemsPerPage, onSetCurrent, onSetItemsPerPage } = usePaginationState();

	const { isLoading, isSuccess, data: requests } = useAppRequestsQuery(appId, { limit: itemsPerPage, offset: current });
	const { t } = useTranslation();

	const { mutate } = useMarkAppRequestsAsSeenMutation();

	useEffect(() => {
		if (!canManageApps || !isSuccess) {
			return;
		}

		const unseenRequests = requests.data.filter(({ seen }) => !seen).map(({ id }) => id);

		const timeout = setTimeout(() => {
			mutate(unseenRequests);
		}, 1000);

		return () => {
			clearTimeout(timeout);
		};
	}, [canManageApps, requests?.data, isSuccess, mutate]);

	if (isLoading) {
		return (
			<Box w='full' maxWidth='x608' marginInline='auto' pbs={36}>
				<AppRequestsLoading />
			</Box>
		);
	}

	if (!isSuccess || !requests.data.length) {
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
				{requests.data.map((request) => (
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
				count={requests.meta.total}
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
