import { Button, ButtonGroup } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useRouteParameter, useRoute } from '@rocket.chat/ui-contexts';
import { useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import SlaEditWithData from './SlaEditWithData';
import SlaNew from './SlaNew';
import SlaTable from './SlaTable';
import {
	Contextualbar,
	ContextualbarTitle,
	ContextualbarHeader,
	ContextualbarClose,
	ContextualbarDialog,
} from '../../components/Contextualbar';
import { Page, PageHeader, PageContent } from '../../components/Page';

const SlaPage = () => {
	const { t } = useTranslation();
	const reload = useRef(() => null);

	const slaPoliciesRoute = useRoute('omnichannel-sla-policies');
	const context = useRouteParameter('context');
	const id = useRouteParameter('id');

	const handleReload = useCallback(() => {
		reload.current();
	}, []);

	const handleClick = useEffectEvent(() =>
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
					<SlaTable reload={reload} />
				</PageContent>
			</Page>
			{context && (
				<ContextualbarDialog>
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
				</ContextualbarDialog>
			)}
		</Page>
	);
};

export default SlaPage;
