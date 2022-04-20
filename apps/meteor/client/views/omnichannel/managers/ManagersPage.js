import React from 'react';

import FilterByText from '../../../components/FilterByText';
import GenericTable from '../../../components/GenericTable';
import Page from '../../../components/Page';
import AddManager from './AddManager';

function ManagersPage({ data, reload, header, setParams, params, title, renderRow, children }) {
	return (
		<Page flexDirection='row'>
			<Page>
				<Page.Header title={title} />
				<AddManager reload={reload} pi='x24' />
				<Page.Content>
					<GenericTable
						header={header}
						renderRow={renderRow}
						results={data && data.users}
						total={data && data.total}
						setParams={setParams}
						params={params}
						renderFilter={({ onChange, ...props }) => <FilterByText onChange={onChange} {...props} />}
					/>
				</Page.Content>
			</Page>
			{children}
		</Page>
	);
}

export default ManagersPage;
