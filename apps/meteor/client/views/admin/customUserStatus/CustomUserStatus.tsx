import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { CSSProperties, Dispatch, ReactElement, SetStateAction, useMemo } from 'react';

import FilterByText from '../../../components/FilterByText';
import GenericTable from '../../../components/GenericTable';
import { GenericTableCell } from '../../../components/GenericTable/V2/GenericTableCell';
import { GenericTableHeaderCell } from '../../../components/GenericTable/V2/GenericTableHeaderCell';
import { GenericTableRow } from '../../../components/GenericTable/V2/GenericTableRow';
import MarkdownText from '../../../components/MarkdownText';

const style: CSSProperties = { whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' };

export type paramsType = {
	text?: string;
	current?: number;
	itemsPerPage?: 25 | 50 | 100;
};
type statusType = { _id: string; name: string; statusType: string };

export type SortType = ['name' | 'statusType', 'asc' | 'desc'];
export type DataType = {
	statuses: {
		_id: string;
		name: string;
		statusType: string;
	}[];
	total?: number;
};
type CustomUserStatusProps = {
	data: DataType;
	sort: SortType;
	onClick: (id: string, status: statusType) => () => void;
	onHeaderClick: (sort: SortType[0]) => void;
	setParams: Dispatch<SetStateAction<paramsType>>;
	params: paramsType;
};

function CustomUserStatus({ data, sort, onClick, onHeaderClick, setParams, params }: CustomUserStatusProps): ReactElement {
	const t = useTranslation();

	const header = useMemo(
		() =>
			[
				<GenericTableHeaderCell key='name' direction={sort[1]} active={sort[0] === 'name'} onClick={onHeaderClick} sort='name'>
					{t('Name')}
				</GenericTableHeaderCell>,
				<GenericTableHeaderCell
					key='presence'
					direction={sort[1]}
					active={sort[0] === 'statusType'}
					onClick={onHeaderClick}
					sort='statusType'
				>
					{t('Presence')}
				</GenericTableHeaderCell>,
			].filter(Boolean),
		[onHeaderClick, sort, t],
	);

	const renderRow = (status: statusType): ReactElement => {
		const { _id, name, statusType } = status;
		return (
			<GenericTableRow
				key={_id}
				onKeyDown={onClick(_id, status)}
				onClick={onClick(_id, status)}
				tabIndex={0}
				role='link'
				action
				qa-user-id={_id}
			>
				<GenericTableCell fontScale='p2' color='default' style={style}>
					<MarkdownText content={name} parseEmoji={true} variant='inline' />
				</GenericTableCell>
				<GenericTableCell fontScale='p2' color='default' style={style}>
					{statusType}
				</GenericTableCell>
			</GenericTableRow>
		);
	};

	return (
		<GenericTable
			header={header}
			renderRow={renderRow}
			results={data?.statuses ?? []}
			total={data?.total ?? 0}
			setParams={setParams}
			params={params}
			renderFilter={({ onChange, ...props }): ReactElement => <FilterByText onChange={(params): void => onChange?.(params)} {...props} />}
		/>
	);
}

export default CustomUserStatus;
