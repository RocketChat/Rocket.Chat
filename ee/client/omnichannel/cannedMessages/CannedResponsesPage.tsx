import { Button, Icon, ButtonGroup } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { FC, ReactNode } from 'react';

import FilterByText from '../../../../client/components/FilterByText';
import GenericTable from '../../../../client/components/GenericTable';
import VerticalBar from '../../../../client/components/VerticalBar';
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
	children: ReactNode;
};

const CannedResponsesPage: FC<CannedResponsesPageProps> = ({
	data,
	header,
	setParams,
	params,
	title,
	renderRow,
	children,
}) => {
	const t = useTranslation();

	const cannedResponsesRoute = useRoute('');

	const handleClick = useMutableCallback(() =>
		cannedResponsesRoute.push({
			context: 'new',
		}),
	);

	return (
		<VerticalBar>
			<VerticalBar.Header title={title}>
				<ButtonGroup>
					<Button onClick={handleClick} title={t('New_Canned_Response')}>
						<Icon name='plus' /> {t('New')}
					</Button>
				</ButtonGroup>
			</VerticalBar.Header>
			<VerticalBar.Content>
				<GenericTable
					renderFilter={({ onChange, ...props }): ReactNode => (
						<FilterByText onChange={onChange} {...props} />
					)}
					header={header}
					renderRow={renderRow}
					results={data && data.cannedResponses}
					total={data && data.total}
					setParams={setParams}
					params={params}
				/>
			</VerticalBar.Content>
			{children}
		</VerticalBar>
	);
};

export default CannedResponsesPage;
