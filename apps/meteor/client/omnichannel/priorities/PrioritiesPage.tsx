import { Button, ButtonGroup } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useEndpoint, useRoute, useSetModal, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { PrioritiesResetModal } from './PrioritiesResetModal';
import { PrioritiesTable } from './PrioritiesTable';
import type { PriorityFormData } from './PriorityEditForm';
import PriorityList from './PriorityList';
import { Page, PageHeader, PageContent } from '../../components/Page';
import { useOmnichannelPriorities } from '../hooks/useOmnichannelPriorities';

type PrioritiesPageProps = {
	priorityId: string;
	context: 'edit' | undefined;
};

export const PrioritiesPage = ({ priorityId, context }: PrioritiesPageProps): ReactElement => {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const prioritiesRoute = useRoute('omnichannel-priorities');

	const dispatchToastMessage = useToastMessageDispatch();
	const setModal = useSetModal();

	const [isResetting, setResetting] = useState(false);

	const savePriority = useEndpoint('PUT', `/v1/livechat/priorities/:priorityId`, { priorityId });
	const resetPriorities = useEndpoint('POST', '/v1/livechat/priorities.reset');

	const { data: priorities, isLoading } = useOmnichannelPriorities();

	const isPrioritiesDirty = useMemo(() => !!priorities.length && priorities.some((p) => p.dirty), [priorities]);

	const handleReset = (): void => {
		const onReset = async (): Promise<void> => {
			try {
				setResetting(true);
				setModal(null);

				await resetPriorities();
				await queryClient.invalidateQueries({
					queryKey: ['/v1/livechat/priorities'],
					exact: true,
				});

				prioritiesRoute.push({});
				dispatchToastMessage({ type: 'success', message: t('Priorities_restored') });
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			} finally {
				setResetting(false);
			}
		};

		setModal(<PrioritiesResetModal onReset={onReset} onCancel={(): void => setModal(null)} />);
	};

	const onRowClick = useEffectEvent((id: string): void => {
		prioritiesRoute.push({ context: 'edit', id });
	});

	const onContextualbarClose = (): void => {
		prioritiesRoute.push({});
	};

	const onSavePriority = async ({ reset, ...payload }: PriorityFormData): Promise<void> => {
		await savePriority(reset ? { reset } : payload);
		await queryClient.invalidateQueries({
			queryKey: ['/v1/livechat/priorities'],
		});

		dispatchToastMessage({ type: 'success', message: t('Priority_saved') });
		await queryClient.invalidateQueries({
			queryKey: ['/v1/livechat/priorities'],
			exact: true,
		});
		prioritiesRoute.push({});
	};

	return (
		<Page flexDirection='row'>
			<Page>
				<PageHeader title={t('Priorities')}>
					<ButtonGroup>
						<Button onClick={handleReset} title={t('Reset')} disabled={!isPrioritiesDirty} loading={isResetting}>
							{t('Reset')}
						</Button>
					</ButtonGroup>
				</PageHeader>
				<PageContent>
					<PrioritiesTable priorities={priorities} isLoading={isLoading} onRowClick={onRowClick} />
				</PageContent>
			</Page>
			{context === 'edit' && (
				<PriorityList priorityId={priorityId} context={context} onSave={onSavePriority} onClose={onContextualbarClose} />
			)}
		</Page>
	);
};
