import type { IOmnichannelRoom } from '@rocket.chat/core-typings';
import { Serialized } from '@rocket.chat/core-typings';
import React, { Key, memo, ReactElement, ReactNode } from 'react';

import GenericTable from '../../../components/GenericTable';
import Page from '../../../components/Page';
import FilterByText from './FilterByText';

type CurrentChatsPageData = {
	rooms: Serialized<IOmnichannelRoom>[];
	count: number;
	offset: number;
	total: number;
};

type CurrentChatsPageDataParams = {
	guest: string;
	fname: string;
	servedBy: string;
	status: string;
	department: string;
	from: string;
	to: string;
	customFields: any;
	current: number;
	itemsPerPage: 25 | 50 | 100;
	tags: string[];
};

const CurrentChatsPage = ({
	data,
	header,
	setParams,
	params,
	title,
	renderRow,
}: {
	data?: CurrentChatsPageData;
	header: ReactNode;
	setParams: (params: any) => void; // TODO: Change to GenericTable V2
	params: CurrentChatsPageDataParams;
	title: string;
	renderRow: (props: { _id?: Key }) => ReactElement;
}): ReactElement => (
	<Page>
		<Page.Header title={title} />
		<Page.Content>
			<GenericTable
				header={header}
				renderRow={renderRow}
				results={data?.rooms}
				total={data?.total}
				params={params}
				setParams={setParams}
				renderFilter={({ onChange, ...props }: any): ReactElement => <FilterByText setFilter={onChange} {...props} />}
			/>
		</Page.Content>
	</Page>
);

export default memo(CurrentChatsPage);
