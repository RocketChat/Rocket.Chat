import React, { FC, memo } from 'react';

import GenericTable from '../../../components/GenericTable';
import Page from '../../../components/Page';
import FilterByText from './FilterByText';

const CurrentChatsPage: FC<{
	data: any;
	header: any;
	setParams: any;
	params: any;
	title: any;
	renderRow: any;
	reload: any;
}> = ({ data, header, setParams, params, title, renderRow, reload }) => (
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
				renderFilter={({ onChange, ...props }: any): any => (
					<FilterByText setFilter={onChange} {...props} />
				)}
			/>
		</Page.Content>
	</Page>
);

export default memo(CurrentChatsPage);
