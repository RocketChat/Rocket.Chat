import React, { Dispatch, FC, Key, memo, ReactElement, ReactNode, SetStateAction } from 'react';

import { FromApi } from '../../../../definition/FromApi';
import { IOmnichannelRoom } from '../../../../definition/IRoom';
import GenericTable from '../../../components/GenericTable';
import Page from '../../../components/Page';
import FilterByText from './FilterByText';

type CurrentChatsPageData = {
	rooms: FromApi<IOmnichannelRoom>[];
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
	itemsPerPage: number;
	tags: string[];
};

const CurrentChatsPage: FC<{
	data?: CurrentChatsPageData;
	header: ReactNode;
	setParams: Dispatch<SetStateAction<CurrentChatsPageDataParams>>;
	params: CurrentChatsPageDataParams;
	title: string;
	renderRow: (props: { _id?: Key }) => ReactElement;
	reload: () => void;
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
