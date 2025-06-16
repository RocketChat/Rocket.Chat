import { Button, ButtonGroup, Pagination } from '@rocket.chat/fuselage';
import { useToastMessageDispatch, useRouteParameter, useMethod, useTranslation, useEndpoint, useRouter } from '@rocket.chat/ui-contexts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { ComponentProps } from 'react';
import { useMemo, useState, useEffect } from 'react';

import HistoryContent from './HistoryContent';
import { sdk } from '../../../../../../app/utils/client/lib/SDKClient';
import { CustomScrollbars } from '../../../../../components/CustomScrollbars';
import { usePagination } from '../../../../../components/GenericTable/hooks/usePagination';
import { Page, PageHeader, PageContent } from '../../../../../components/Page';

const OutgoingWebhookHistoryPage = (props: ComponentProps<typeof Page>) => {
	const dispatchToastMessage = useToastMessageDispatch();
	const t = useTranslation();
	const router = useRouter();

	const { itemsPerPage, setItemsPerPage, current, setCurrent, itemsPerPageLabel, showingResultsLabel } = usePagination();

	const [mounted, setMounted] = useState(false);
	const [total, setTotal] = useState(0);

	const clearIntegrationHistory = useMethod('clearIntegrationHistory');

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

	const queryKey = useMemo(() => ['integrations/history', id, itemsPerPage, current], [id, itemsPerPage, current]);

	const queryClient = useQueryClient();

	type HistoryData = Awaited<ReturnType<typeof fetchHistory>>;

	const { data, isPending, refetch } = useQuery({
		queryKey,
		queryFn: async () => {
			const result = fetchHistory(query);
			setMounted(true);
			return result;
		},
		gcTime: 99999,
		staleTime: 99999,
	});

	const handleClearHistory = async (): Promise<void> => {
		try {
			await clearIntegrationHistory(id);
			dispatchToastMessage({ type: 'success', message: t('Integration_History_Cleared') });
			refetch();
			setMounted(false);
		} catch (e) {
			dispatchToastMessage({ type: 'error', message: e });
		}
	};

	useEffect(() => {
		if (mounted) {
			return sdk.stream('integrationHistory', [id], (integration) => {
				if (integration.type === 'inserted') {
					setTotal((total) => total + 1);
					queryClient.setQueryData<HistoryData>(queryKey, (oldData): HistoryData | undefined => {
						if (!oldData || !integration.data) {
							return;
						}
						return {
							...oldData,
							history: [integration.data as unknown as HistoryData['history'][number]].concat(oldData.history),
							total: oldData.total + 1,
						};
					});
				}

				if (integration.type === 'updated') {
					queryClient.setQueryData<HistoryData>(queryKey, (oldData): HistoryData | undefined => {
						if (!oldData) {
							return;
						}
						const index = oldData.history.findIndex(({ _id }) => _id === id);
						if (index === -1) {
							return;
						}
						Object.assign(oldData.history[index], integration.diff);
						return { ...oldData };
					});
					return;
				}

				if (integration.type === 'removed') {
					refetch();
				}
			}).stop;
		}
	}, [id, mounted, queryClient, queryKey, refetch]);

	return (
		<Page flexDirection='column' {...props}>
			<PageHeader
				title={t('Integration_Outgoing_WebHook_History')}
				onClickBack={() => router.navigate(`/admin/integrations/edit/outgoing/${id}`)}
			>
				<ButtonGroup>
					<Button icon='trash' danger onClick={handleClearHistory} disabled={total === 0}>
						{t('clear_history')}
					</Button>
				</ButtonGroup>
			</PageHeader>
			<PageContent>
				<CustomScrollbars>
					<HistoryContent key='historyContent' data={data?.history || []} isLoading={isPending} />
				</CustomScrollbars>
				<Pagination
					current={current}
					itemsPerPage={itemsPerPage}
					itemsPerPageLabel={itemsPerPageLabel}
					showingResultsLabel={showingResultsLabel}
					count={data?.total || 0}
					onSetItemsPerPage={setItemsPerPage}
					onSetCurrent={setCurrent}
				/>
			</PageContent>
		</Page>
	);
};

export default OutgoingWebhookHistoryPage;
