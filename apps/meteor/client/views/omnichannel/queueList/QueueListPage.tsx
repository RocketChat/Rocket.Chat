import React, { Dispatch, Key, ReactElement, ReactNode, SetStateAction } from 'react';

import GenericTable from '../../../components/GenericTable';
import Page from '../../../components/Page';
import { QueueListFilter } from './QueueListFilter';

type QueueListPagePropsParamsType = {
	servedBy: string;
	status: string;
	departmentId: string;
	itemsPerPage: number;
	current: number;
};

type QueueListPagePropsType = {
	title: string;
	header: ReactNode;
	data?: {
		queue: {
			chats: number;
			department: { _id: string; name: string };
			user: { _id: string; username: string; status: string };
		}[];
		count: number;
		offset: number;
		total: number;
	};
	params: QueueListPagePropsParamsType;
	setParams: Dispatch<SetStateAction<QueueListPagePropsParamsType>>;
	renderRow: (props: { _id?: Key }) => ReactElement;
};

export const QueueListPage = ({ title, header, data, renderRow, params, setParams }: QueueListPagePropsType): ReactElement => (
	<Page>
		<Page.Header title={title} />
		<Page.Content>
			<GenericTable
				header={header}
				renderFilter={({ onChange, ...props }: any): ReactElement => <QueueListFilter setFilter={onChange} {...props} />}
				renderRow={renderRow}
				results={data?.queue}
				total={data?.total}
				params={params}
				setParams={setParams}
			/>
		</Page.Content>
	</Page>
);
