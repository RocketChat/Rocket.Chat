import type { IOmnichannelServiceLevelAgreements, Serialized } from '@rocket.chat/core-typings';
import { Button, Icon, ButtonGroup } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import type { PaginatedResult } from '@rocket.chat/rest-typings';
import { useRoute, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement, ReactNode } from 'react';
import React, { useCallback } from 'react';

import FilterByText from '../../../../client/components/FilterByText';
import GenericTable from '../../../../client/components/GenericTable';
import type { GenericTableParams } from '../../../../client/components/GenericTable/GenericTable';
import Page from '../../../../client/components/Page';

type RowData = Partial<{ _id?: number | string; name: string; description: string; dueTimeInMinutes: number }>;

type SlasPageProps = {
	data?: Serialized<PaginatedResult<{ sla: IOmnichannelServiceLevelAgreements[] }>>;
	header: ReactElement[];
	setParams: (params: GenericTableParams) => void;
	params: GenericTableParams;
	title: string;
	renderRow: ({ _id, name, description, dueTimeInMinutes }: RowData) => ReactElement;
	children: ReactNode;
};

function SlasPage({ data, header, setParams, params, title, renderRow, children }: SlasPageProps): ReactElement {
	const t = useTranslation();

	const slaPoliciesRoute = useRoute('omnichannel-sla-policies');

	const handleClick = useMutableCallback(() =>
		slaPoliciesRoute.push({
			context: 'new',
		}),
	);

	const renderFilter = useCallback(
		({ onChange = (): void => undefined, ...props }): ReactElement => <FilterByText onChange={onChange} {...props} />,
		[],
	);

	return (
		<Page flexDirection='row'>
			<Page>
				<Page.Header title={title}>
					<ButtonGroup>
						<Button onClick={handleClick} title={t('New_SLA_Policy')}>
							<Icon name='plus' /> {t('New')}
						</Button>
					</ButtonGroup>
				</Page.Header>
				<Page.Content>
					<GenericTable
						header={header}
						renderRow={renderRow}
						results={data?.sla}
						total={data?.total}
						setParams={setParams}
						params={params}
						renderFilter={renderFilter}
					/>
				</Page.Content>
			</Page>
			{children}
		</Page>
	);
}

export default SlasPage;
