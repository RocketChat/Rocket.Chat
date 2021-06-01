import { Button, Icon, ButtonGroup } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { FC, ReactElement, useState } from 'react';

import GenericTable from '../../../../client/components/GenericTable';
import Page from '../../../../client/components/Page';
import { useRoute } from '../../../../client/contexts/RouterContext';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { EndpointResponse } from '../../../../definition/IOmnichannelCannedResponse';

export type CannedResponsesPageProps = {
	data: EndpointResponse;
	header: FC;
	setParams: () => void;
	params: { text: string; current: number; itemsPerPage: number };
	title: string;
	renderRow: FC;
	children: ReactElement;
	renderFilter: ReactElement;
};

const CannedResponsesPage: FC<CannedResponsesPageProps> = ({
	data,
	header,
	setParams,
	params,
	title,
	renderRow,
	children,
	renderFilter,
}) => {
	const t = useTranslation();

	const Route = useRoute('');

	const handleClick = useMutableCallback(() =>
		Route.push({
			context: 'new',
		}),
	);

	return (
		<Page>
			<Page.Header title={title}>
				<ButtonGroup>
					<Button onClick={handleClick} title={t('New_Canned_Response')}>
						<Icon name='plus' /> {t('New')}
					</Button>
				</ButtonGroup>
			</Page.Header>
			<Page.Content>
				<GenericTable
					renderFilter={renderFilter}
					header={header}
					renderRow={renderRow}
					results={data && data.cannedResponses}
					total={data && data.total}
					setParams={setParams}
					params={params}
				/>
			</Page.Content>
			{children}
		</Page>
	);
};

export default CannedResponsesPage;
