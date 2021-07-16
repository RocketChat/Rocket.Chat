import { Button, Icon, ButtonGroup } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { FC, ReactNode, ReactElement, Dispatch, SetStateAction } from 'react';

import GenericTable from '../../../../client/components/GenericTable';
import NoResults from '../../../../client/components/GenericTable/NoResults';
import Page from '../../../../client/components/Page';
import { useRoute } from '../../../../client/contexts/RouterContext';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { EndpointResponse } from './IOmnichannelCannedResponse';

export type CannedResponsesPageProps = {
	data: EndpointResponse | undefined;
	header: ReactElement[];
	setParams: Dispatch<SetStateAction<{ current: number; itemsPerPage: number }>>;
	params: { current: number; itemsPerPage: number };
	title: string;
	renderRow: ReactNode | null;
	children: ReactNode | null;
	renderFilter: FC;
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
				{data && data.total > 0 ? (
					<GenericTable
						renderFilter={renderFilter}
						header={header}
						renderRow={renderRow}
						results={data && data.cannedResponses}
						total={data && data.total}
						setParams={setParams}
						params={params}
					/>
				) : (
					<NoResults
						icon='baloon-exclamation'
						title={t('No_Canned_Responses_Yet')}
						description={t('No_Canned_Responses_Yet-description')}
						buttonTitle={t('Create_your_First_Canned_Response')}
						buttonAction={(): void => {
							console.log('TODO! ROUTE TO NEW AND EDIT PAGE WHEN THEY EXIST!!!!');
						}}
					></NoResults>
				)}
			</Page.Content>
			{children}
		</Page>
	);
};

export default CannedResponsesPage;
