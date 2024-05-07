import type { IUserStatus } from '@rocket.chat/core-typings';
import type { CSSProperties, ReactElement } from 'react';
import React from 'react';

import { GenericTableRow, GenericTableCell } from '../../../../components/GenericTable';
import MarkdownText from '../../../../components/MarkdownText';

const style: CSSProperties = { whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' };

type CustomUserStatusRowProps = {
	status: IUserStatus;
	onClick: (id: string) => void;
};

const CustomUserStatusRow = ({ status, onClick }: CustomUserStatusRowProps): ReactElement => {
	const { _id, name, statusType } = status;

	return (
		<GenericTableRow
			key={_id}
			onKeyDown={(): void => onClick(_id)}
			onClick={(): void => onClick(_id)}
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

export default CustomUserStatusRow;
