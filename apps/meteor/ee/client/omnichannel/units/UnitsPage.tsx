import { Button, ButtonGroup } from '@rocket.chat/fuselage';
import { useTranslation, useRouteParameter, useRouter } from '@rocket.chat/ui-contexts';
import React from 'react';

import Page from '../../../../client/components/Page';
import UnitEdit from './UnitEdit';
import UnitEditWithData from './UnitEditWithData';
import UnitsTable from './UnitsTable';

const UnitsPage = () => {
	const t = useTranslation();
	const router = useRouter();

	const context = useRouteParameter('context');
	const id = useRouteParameter('id');

	return (
		<Page flexDirection='row'>
			<Page>
				<Page.Header title={t('Units')}>
					<ButtonGroup>
						<Button onClick={() => router.navigate('/omnichannel/units/new')} title={t('New_Unit')}>
							{t('Create_unit')}
						</Button>
					</ButtonGroup>
				</Page.Header>
				<Page.Content>
					<UnitsTable />
				</Page.Content>
			</Page>
			{context === 'edit' && id && <UnitEditWithData unitId={id} />}
			{context === 'new' && <UnitEdit />}
		</Page>
	);
};

export default UnitsPage;
