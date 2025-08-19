import { Button, ButtonGroup } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useTranslation, useRouteParameter, useRouter } from '@rocket.chat/ui-contexts';

import UnitEdit from './UnitEdit';
import UnitEditWithData from './UnitEditWithData';
import UnitsTable from './UnitsTable';
import { ContextualbarDialog } from '../../components/Contextualbar';
import { Page, PageHeader, PageContent } from '../../components/Page';

const UnitsPage = () => {
	const t = useTranslation();
	const router = useRouter();

	const context = useRouteParameter('context');
	const id = useRouteParameter('id');

	const handleCloseContextualbar = useEffectEvent(() => router.navigate('/omnichannel/units'));

	return (
		<Page flexDirection='row'>
			<Page>
				<PageHeader title={t('Units')}>
					<ButtonGroup>
						<Button onClick={() => router.navigate('/omnichannel/units/new')} title={t('New_Unit')}>
							{t('Create_unit')}
						</Button>
					</ButtonGroup>
				</PageHeader>
				<PageContent>
					<UnitsTable />
				</PageContent>
			</Page>
			{context && (
				<ContextualbarDialog onClose={handleCloseContextualbar}>
					{context === 'edit' && id && <UnitEditWithData unitId={id} onClose={handleCloseContextualbar} />}
					{context === 'new' && <UnitEdit onClose={handleCloseContextualbar} />}
				</ContextualbarDialog>
			)}
		</Page>
	);
};

export default UnitsPage;
