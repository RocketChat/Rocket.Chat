import React, { FC, Key, ReactNode, ReactElement } from 'react';

import FilterByText from '../../../components/FilterByText';
import GenericTable from '../../../components/GenericTable';
import Page from '../../../components/Page';
import AddAgent from './AddAgent';

type AgentPageProps = {
	reload: () => void;
	data: any;
	header: ReactNode;
	setParams: (params: any) => void;
	params: any;
	title: string;
	renderRow: (props: { _id?: Key }) => ReactElement;
};

const AgentsPage: FC<AgentPageProps> = ({ data, reload, header, setParams, params, title, renderRow, children }) => (
	<Page flexDirection='row'>
		<Page>
			<Page.Header title={title} />
			<AddAgent reload={reload} pi='x24' />
			<Page.Content>
				<GenericTable
					header={header}
					renderRow={renderRow}
					results={data?.users}
					total={data?.total}
					setParams={setParams}
					params={params}
					renderFilter={({ onChange, ...props }: any): any => <FilterByText setFilter={onChange} {...props} />}
				/>
			</Page.Content>
		</Page>
		{children}
	</Page>
);

export default AgentsPage;
