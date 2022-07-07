import type { IOmnichannelRoom } from '@rocket.chat/core-typings';
import { Serialized } from '@rocket.chat/core-typings';
import React, { Dispatch, Key, memo, ReactElement, ReactNode, SetStateAction } from 'react';

import GenericTable from '../../../components/GenericTable';
import Page from '../../../components/Page';
import CustomFieldsVerticalBar from './CustomFieldsVerticalBar';
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
	current: number;
	itemsPerPage: 25 | 50 | 100;
	tags: string[];
};

const CurrentChatsPage = ({
	data,
	header,
	setParams,
	params,
	customFields,
	setCustomFields,
	title,
	renderRow,
	context,
}: {
	data?: CurrentChatsPageData;
	header: ReactNode;
	setParams: (params: any) => void; // TODO: Change to GenericTable V2
	params: CurrentChatsPageDataParams;
	customFields: { [key: string]: string };
	setCustomFields: Dispatch<SetStateAction<{ [key: string]: string }>>;
	title: string;
	renderRow: (props: { _id?: Key }) => ReactElement;
	context?: string;
}): ReactElement => (
	<Page flexDirection='row'>
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
					renderFilter={({ onChange, ...props }: any): ReactElement => (
						<FilterByText setFilter={onChange} setCustomFields={setCustomFields} customFields={customFields} {...props} />
					)}
				/>
			</Page.Content>
		</Page>
		{context === 'custom-fields' && <CustomFieldsVerticalBar setCustomFields={setCustomFields} customFields={customFields} />}
	</Page>
);

export default memo(CurrentChatsPage);
