import { Button, ButtonGroup } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useRouteParameter, useRoute, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useRef, useCallback } from 'react';

import { Contextualbar, ContextualbarTitle, ContextualbarHeader, ContextualbarClose } from '../../../../client/components/Contextualbar';
import Page from '../../../../client/components/Page';
import SlaEditWithData from './SlaEditWithData';
import SlaNew from './SlaNew';
import SlaTable from './SlaTable';

const SlaPage = () => {
	const t = useTranslation();
	const reload = useRef(() => null);

	const slaPoliciesRoute = useRoute('omnichannel-sla-policies');
	const context = useRouteParameter('context');
	const id = useRouteParameter('id');

	const handleReload = useCallback(() => {
		reload.current();
	}, []);

	const handleClick = useMutableCallback(() =>
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
				<Page.Header title={t('SLA_Policies')}>
					<ButtonGroup>
						<Button onClick={handleClick}>{t('Create_SLA_policy')}</Button>
					</ButtonGroup>
				</Page.Header>
				<Page.Content>
					<SlaTable reload={reload} />
				</Page.Content>
			</Page>
			{context && (
				<Contextualbar>
					<ContextualbarHeader>
						<ContextualbarTitle>
							{context === 'edit' && t('Edit_SLA_Policy')}
							{context === 'new' && t('New_SLA_Policy')}
						</ContextualbarTitle>
						<ContextualbarClose onClick={handleCloseContextualbar} />
					</ContextualbarHeader>
					{context === 'edit' && id && <SlaEditWithData slaId={id} reload={handleReload} />}
					{context === 'new' && <SlaNew reload={handleReload} />}
				</Contextualbar>
			)}
		</Page>
	);
};

export default SlaPage;
