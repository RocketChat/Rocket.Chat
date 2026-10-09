import { Button, ButtonGroup, Pagination } from '@rocket.chat/fuselage';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { CustomScrollbars, usePaginatedQueryKey, Page, PageHeader, PageContent } from '@rocket.chat/ui-client';
import { useToastMessageDispatch, useRouteParameter, useTranslation, useEndpoint, useRouter } from '@rocket.chat/ui-contexts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { ComponentProps } from 'react';
import { useMemo, useState, useEffect } from 'react';

import HistoryContent from './HistoryContent';
import { sdk } from '../../../../../lib/SDKClient';

const OutgoingWebhookHistoryPage = (props: ComponentProps<typeof Page>) => {
	const dispatchToastMessage = useToastMessageDispatch();
	const t = useTranslation();
	const router = useRouter();

	const [mounted, setMounted] = useState(false);
	const [total, setTotal] = useState(0);

	const clearIntegrationHistory = useEndpoint('POST', '/v1/integrations.clearHistory');

	const id = useRouteParameter('id') as string;

	const query = useMemo(() => ({ id }), [id]);
	const { paginatedQuery, queryKey, paginationProps } = usePaginatedQueryKey({
		query,
		getQueryKey: (query) => ['integrations/history', query.id, query.count, query.offset] as const,
	});

	const fetchHistory = useEndpoint('GET', '/v1/integrations.history');

	const queryClient = useQueryClient();

	type HistoryData = Awaited<ReturnType<typeof fetchHistory>>;

	const { data, isPending, refetch } = useQuery({
		queryKey,
		queryFn: async () => {
			const result = fetchHistory(paginatedQuery);
			setMounted(true);
			return result;
		},
		gcTime: 99999,
		staleTime: 99999,
	});

	const setHistoryData = useStableCallback((updater: (oldData: HistoryData | undefined) => HistoryData | undefined) =>
		queryClient.setQueryData<HistoryData>(queryKey, updater),
	);

	const handleClearHistory = async (): Promise<void> => {
		try {
			await clearIntegrationHistory({ integrationId: id });
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
					setHistoryData((oldData): HistoryData | undefined => {
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
					setHistoryData((oldData): HistoryData | undefined => {
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
	}, [id, mounted, refetch, setHistoryData]);

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
				<Pagination {...paginationProps} />
			</PageContent>
		</Page>
	);
};

export default OutgoingWebhookHistoryPage;
