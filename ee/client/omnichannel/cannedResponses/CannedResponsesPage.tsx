import { Button, Icon, ButtonGroup } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { FC, ReactNode, ReactElement, Dispatch, SetStateAction } from 'react';

import GenericTable from '../../../../client/components/GenericTable';
import NoResults from '../../../../client/components/GenericTable/NoResults';
import Page from '../../../../client/components/Page';
import { useRoute } from '../../../../client/contexts/RouterContext';
import { useTranslation } from '../../../../client/contexts/TranslationContext';

export type CannedResponsesPageProps = {
	data: any;
	header: ReactElement[];
	setParams: Dispatch<SetStateAction<{ current: number; itemsPerPage: number }>>;
	params: { current: number; itemsPerPage: number };
	title: string;
	renderRow: ReactNode | null;
	renderFilter: FC;
};

const CannedResponsesPage: FC<CannedResponsesPageProps> = ({
	data,
	header,
	setParams,
	params,
	title,
	renderRow,
	renderFilter,
}) => {
	const t = useTranslation();

	const Route = useRoute('omnichannel-canned-responses');

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
				{data && data.total < 1 ? (
					<NoResults
						icon='baloon-exclamation'
						title={t('No_Canned_Responses_Yet')}
						description={t('No_Canned_Responses_Yet-description')}
						buttonTitle={t('Create_your_First_Canned_Response')}
						buttonAction={handleClick}
					></NoResults>
				) : (
					<GenericTable
						renderFilter={renderFilter}
						header={header}
						renderRow={renderRow}
						results={data && data.cannedResponses}
						total={data && data.total}
						setParams={setParams}
						params={params}
					/>
				)}
			</Page.Content>
		</Page>
	);
};

export default CannedResponsesPage;
