import { Button, ButtonGroup } from '@rocket.chat/fuselage';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import {
	ContextualbarTitle,
	ContextualbarHeader,
	ContextualbarClose,
	ContextualbarDialog,
	Page,
	PageHeader,
	PageContent,
} from '@rocket.chat/ui-client';
import { useRouteParameter, useRoute } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import SlaEditWithData from './SlaEditWithData';
import SlaNew from './SlaNew';
import SlaTable from './SlaTable';

const SlaPage = () => {
	const { t } = useTranslation();
	const queryClient = useQueryClient();

	const slaPoliciesRoute = useRoute('omnichannel-sla-policies');
	const context = useRouteParameter('context');
	const id = useRouteParameter('id');

	const handleReload = useCallback(() => {
		queryClient.invalidateQueries({ queryKey: ['/v1/livechat/sla'] });
	}, [queryClient]);

	const handleClick = useStableCallback(() =>
		slaPoliciesRoute.push({
			context: 'new',
		}),
	);

	const handleCloseContextualbar = (): void => {
		slaPoliciesRoute.push({});
	};

	return (
		<Page flexDirection='row'>
			<Page>
				<PageHeader title={t('SLA_Policies')}>
					<ButtonGroup>
						<Button onClick={handleClick}>{t('Create_SLA_policy')}</Button>
					</ButtonGroup>
				</PageHeader>
				<PageContent>
					<SlaTable />
				</PageContent>
			</Page>
			{context && (
				<ContextualbarDialog onClose={handleCloseContextualbar}>
					<ContextualbarHeader>
						<ContextualbarTitle>
							{context === 'edit' && t('Edit_SLA_Policy')}
							{context === 'new' && t('New_SLA_Policy')}
						</ContextualbarTitle>
						<ContextualbarClose onClick={handleCloseContextualbar} />
					</ContextualbarHeader>
					{context === 'edit' && id && <SlaEditWithData slaId={id} reload={handleReload} />}
					{context === 'new' && <SlaNew reload={handleReload} />}
				</ContextualbarDialog>
			)}
		</Page>
	);
};

export default SlaPage;
