import React from 'react';

import GenericTable from '../../../components/GenericTable';
import Page from '../../../components/Page';
import FilterByText from './FilterByText';

function CurrentChatsPage({ data, header, setParams, params, title, renderRow, reload, children }) {
	return (
		<Page flexDirection='row'>
			<Page>
				<Page.Header title={title} />
				<Page.Content>
					<GenericTable
						header={header}
						renderRow={renderRow}
						results={data && data.rooms}
						total={data && data.total}
						setParams={setParams}
						params={params}
						reload={reload}
						renderFilter={({ onChange, ...props }) => (
							<FilterByText setFilter={onChange} {...props} />
						)}
					/>
				</Page.Content>
			</Page>
			{children}
		</Page>
	);
}

export default CurrentChatsPage;
