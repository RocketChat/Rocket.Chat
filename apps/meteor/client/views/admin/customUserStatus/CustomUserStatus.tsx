import { Table } from '@rocket.chat/fuselage';
import React, { CSSProperties, KeyboardEventHandler, MouseEventHandler, ReactElement, useMemo } from 'react';

import FilterByText from '../../../components/FilterByText';
import GenericTable from '../../../components/GenericTable';
import MarkdownText from '../../../components/MarkdownText';
import { useTranslation } from '../../../contexts/TranslationContext';
import type { PaginatedResult } from '/definition/rest/helpers/PaginatedResult';

const style: CSSProperties = { whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' };

type StatusType = {
	_id: string;
	name: string;
	statusType: string | null;
};

type ParamsType = {
	text?: string;
	current?: number;
	itemsPerPage?: 25 | 50 | 100;
};

type CustomUserStatusProps = {
	data: PaginatedResult<{
		statuses: {
			_id: string;
			name: string;
			statusType: string | null;
		}[];
	}>;
	sort: [string, 'asc' | 'desc'];
	onClick: (_id: string, stauts: StatusType) => KeyboardEventHandler<HTMLElement> | MouseEventHandler<HTMLElement>;
	onHeaderClick: (((sort: string) => void) & React.MouseEventHandler<HTMLElement>) | undefined;
	setParams: (params: ParamsType) => void;
	params: ParamsType;
};

const CustomUserStatus = function CustomUserStatus({
	data,
	sort,
	onClick,
	onHeaderClick,
	setParams,
	params,
}: CustomUserStatusProps): ReactElement {
	const t = useTranslation();

	const header = useMemo(
		() =>
			[
				<GenericTable.HeaderCell key='name' direction={sort[1]} active={sort[0] === 'name'} onClick={onHeaderClick} sort='name'>
					{t('Name')}
				</GenericTable.HeaderCell>,
				<GenericTable.HeaderCell
					key='presence'
					direction={sort[1]}
					active={sort[0] === 'statusType'}
					onClick={onHeaderClick}
					sort='statusType'
				>
					{t('Presence')}
				</GenericTable.HeaderCell>,
			].filter(Boolean),
		[onHeaderClick, sort, t],
	);

	const renderRow = (status: StatusType) => {
		const { _id, name, statusType } = status;
		return (
			<Table.Row
				key={_id}
				onKeyDown={onClick(_id, status) as KeyboardEventHandler<HTMLElement>}
				onClick={onClick(_id, status) as MouseEventHandler<HTMLElement>}
				tabIndex={0}
				role='link'
				action
				qa-user-id={_id}
			>
				<Table.Cell fontScale='p2' color='default' style={style}>
					<MarkdownText content={name} parseEmoji={true} variant='inline' />
				</Table.Cell>
				<Table.Cell fontScale='p2' color='default' style={style}>
					{statusType}
				</Table.Cell>
			</Table.Row>
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
			renderFilter={({ onChange, ...props }) => <FilterByText onChange={onChange as (filter: { text: string }) => void} {...props} />}
		/>
	);
};

export default CustomUserStatus;
