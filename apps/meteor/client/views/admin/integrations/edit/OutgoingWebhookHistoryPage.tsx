import { Button, ButtonGroup, Icon, Pagination } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch, useRoute, useRouteParameter, useMethod, useTranslation, useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { ReactElement, ComponentProps } from 'react';
import React, { useMemo, useState, useEffect } from 'react';

import { integrationHistoryStreamer } from '../../../../../app/integrations/client/streamer';
import { usePagination } from '../../../../components/GenericTable/hooks/usePagination';
import Page from '../../../../components/Page';
import ScrollableContentWrapper from '../../../../components/ScrollableContentWrapper';
import HistoryContent from './HistoryContent';

function OutgoingWebhookHistoryPage(props: ComponentProps<typeof Page>): ReactElement {
	const dispatchToastMessage = useToastMessageDispatch();
	const t = useTranslation();

	const { itemsPerPage, setItemsPerPage, current, setCurrent, itemsPerPageLabel, showingResultsLabel } = usePagination();

	const [mounted, setMounted] = useState(false);
	const [total, setTotal] = useState(0);

	const router = useRoute('admin-integrations');

	const clearHistory = useMethod('clearIntegrationHistory');

	const id = useRouteParameter('id') as string;

	const query = useMemo(
		() => ({
			id,
			count: itemsPerPage,
			offset: current,
		}),
		[id, itemsPerPage, current],
	);

	const fetchHistory = useEndpoint('GET', '/v1/integrations.history');

	const queryKey = ['integrations/history', id, itemsPerPage, current];

	const queryClient = useQueryClient();

	type HistoryData = Awaited<ReturnType<typeof fetchHistory>>;

	const { data, isLoading, refetch } = useQuery(
		queryKey,
		async (): Promise<HistoryData> => {
			const result = fetchHistory(query);
			setMounted(true);
			return result;
		},
		{
			cacheTime: 99999,
			staleTime: 99999,
			refetchOnWindowFocus: false,
		},
	);

	const handleClearHistory = async (): Promise<void> => {
		try {
			await clearHistory();
			dispatchToastMessage({ type: 'success', message: t('Integration_History_Cleared') });
			refetch();
			setMounted(false);
		} catch (e) {
			dispatchToastMessage({ type: 'error', message: e });
		}
	};

	const handleClickReturn = (): void => {
		router.push({});
	};

	const handleDataChange = useMutableCallback(
		({
			data,
			type,
			diff,
			id,
		}: {
			id: string;
			type: 'inserted' | 'updated' | 'removed';
			diff: Partial<HistoryData['history'][number]>;
			data: HistoryData['history'][number];
		}) => {
			if (type === 'inserted') {
				setTotal((total) => total + 1);
				queryClient.setQueryData<HistoryData>(queryKey, (oldData): HistoryData | undefined => {
					if (!oldData || !data) {
						return;
					}
					return {
						...oldData,
						history: [data].concat(oldData.history),
						total: oldData.total + 1,
					};
				});
			}

			if (type === 'updated') {
				queryClient.setQueryData<HistoryData>(queryKey, (oldData): HistoryData | undefined => {
					if (!oldData) {
						return;
					}
					const index = oldData.history.findIndex(({ _id }) => _id === id);
					if (index === -1) {
						return;
					}
					Object.assign(oldData.history[index], diff);
					return { ...oldData };
				});
				return;
			}

			if (type === 'removed') {
				refetch();
			}
		},
	);

	useEffect(() => {
		if (mounted) {
			integrationHistoryStreamer.on(id, handleDataChange);
		}

		return () => integrationHistoryStreamer.removeListener(id, handleDataChange);
	}, [handleDataChange, id, mounted]);

	return (
		<Page flexDirection='column' {...props}>
			<Page.Header title={t('Integration_Outgoing_WebHook_History')}>
				<ButtonGroup>
					<Button onClick={handleClickReturn}>
						<Icon name='back' size='x16' /> {t('Back')}
					</Button>
					<Button danger onClick={handleClearHistory} disabled={total === 0}>
						<Icon name='trash' /> {t('clear_history')}
					</Button>
				</ButtonGroup>
			</Page.Header>
			<Page.Content>
				<ScrollableContentWrapper>
					<HistoryContent key='historyContent' data={data?.history || []} isLoading={isLoading} />
				</ScrollableContentWrapper>
				<Pagination
					current={current}
					itemsPerPage={itemsPerPage}
					itemsPerPageLabel={itemsPerPageLabel}
					showingResultsLabel={showingResultsLabel}
					count={data?.total || 0}
					onSetItemsPerPage={setItemsPerPage}
					onSetCurrent={setCurrent}
				/>
			</Page.Content>
		</Page>
	);
}

export default OutgoingWebhookHistoryPage;
