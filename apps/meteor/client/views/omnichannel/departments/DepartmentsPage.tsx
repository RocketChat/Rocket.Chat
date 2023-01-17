import type { ILivechatDepartment, Serialized } from '@rocket.chat/core-typings';
import { Button, Icon } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import type { OperationResult } from '@rocket.chat/rest-typings';
import { useRoute, useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';
import type { Dispatch, SetStateAction, ReactElement, ReactNode, Key } from 'react';

import FilterByText from '../../../components/FilterByText';
import GenericTable from '../../../components/GenericTable';
import type { GenericTableParams } from '../../../components/GenericTable/GenericTable';
import Page from '../../../components/Page';

interface IRenderRow {
	(params: { _id?: Key | undefined }): ReactElement;
}

type DepartmentsPageProps = {
	data?: Serialized<OperationResult<'GET', '/v1/livechat/department'>> | Record<string, never>;
	header: (false | JSX.Element)[];
	setParams: Dispatch<SetStateAction<GenericTableParams>>;
	params: GenericTableParams;
	title: string;
	renderRow: (props: ILivechatDepartment) => ReactElement;
	children?: ReactNode;
};

function DepartmentsPage({ data = {}, header, setParams, params, title, renderRow, children }: DepartmentsPageProps) {
	const departmentsRoute = useRoute('omnichannel-departments');

	const t = useTranslation();

	const onAddNew = useMutableCallback(() =>
		departmentsRoute.push({
			context: 'new',
		}),
	);
	return (
		<Page flexDirection='row'>
			<Page>
				<Page.Header title={title}>
					<Button onClick={onAddNew}>
						<Icon name='plus' /> {t('New')}
					</Button>
				</Page.Header>
				<Page.Content>
					<GenericTable
						header={header}
						renderRow={renderRow as IRenderRow}
						results={data?.departments}
						total={data?.total}
						setParams={setParams}
						params={params}
						renderFilter={({ onChange, ...props }: any) => <FilterByText onChange={onChange} {...props} />}
					/>
				</Page.Content>
			</Page>
			{children}
		</Page>
	);
}

export default DepartmentsPage;
