import React, { ReactElement, Dispatch, SetStateAction } from 'react';

import FilterByText from '../../../components/FilterByText';
import GenericTable from '../../../components/GenericTable';
import Page from '../../../components/Page';
import AddManager from './AddManager';

type ManagersPageProps = {
	data: unknown;
	reload: () => void;
	header: ReactElement;
	setParams: Dispatch<SetStateAction<unknown>>;
	params: { text: string; current: number; itemsPerPage: 25 | 50 | 100 };
	title: string;
	renderRow: () => ReactElement;
	children: ReactElement;
};

const ManagersPage = ({ data, reload, header, setParams, params, title, renderRow, children }: ManagersPageProps): ReactElement => (
	<Page flexDirection='row'>
		<Page>
			<Page.Header title={title} />
			<AddManager reload={reload} pi='x24' />
			<Page.Content>
				<GenericTable
					header={header}
					renderRow={renderRow}
					results={data?.users}
					total={data?.total}
					setParams={setParams}
					params={params}
					renderFilter={({ onChange, ...props }): ReactElement => <FilterByText onChange={onChange} {...props} />}
				/>
			</Page.Content>
		</Page>
		{children}
	</Page>
);

export default ManagersPage;
