import { Button, ButtonGroup } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useRoute, useTranslation } from '@rocket.chat/ui-contexts';
import type { MutableRefObject } from 'react';
import React from 'react';

import Page from '../../../../client/components/Page';
import UnitsTable from './UnitsTable';

const UnitsPage = ({ reload }: { reload: MutableRefObject<() => void> }) => {
	const t = useTranslation();
	const unitsRoute = useRoute('omnichannel-units');

	const handleClick = useMutableCallback(() =>
		unitsRoute.push({
			context: 'new',
		}),
	);

	return (
		<Page flexDirection='row'>
			<Page>
				<Page.Header title={t('Units')}>
					<ButtonGroup>
						<Button onClick={handleClick} title={t('New_Unit')}>
							{t('Create_unit')}
						</Button>
					</ButtonGroup>
				</Page.Header>
				<Page.Content>
					<UnitsTable reload={reload} />
				</Page.Content>
			</Page>
		</Page>
	);
};

export default UnitsPage;
