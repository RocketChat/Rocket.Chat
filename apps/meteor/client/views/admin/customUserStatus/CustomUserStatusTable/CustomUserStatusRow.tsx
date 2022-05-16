import { IUserStatus } from '@rocket.chat/core-typings';
import { TableRow, TableCell } from '@rocket.chat/fuselage';
import React, { CSSProperties, ReactElement } from 'react';

import MarkdownText from '../../../../components/MarkdownText';

const style: CSSProperties = { whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' };

type CustomUserStatusRowProps = {
	status: IUserStatus;
	onClick: (id: string) => void;
};

const CustomUserStatusRow = ({ status, onClick }: CustomUserStatusRowProps): ReactElement => {
	const { _id, name, statusType } = status;

	return (
		<TableRow
			key={_id}
			onKeyDown={(): void => onClick(_id)}
			onClick={(): void => onClick(_id)}
			tabIndex={0}
			role='link'
			action
			qa-user-id={_id}
		>
			<TableCell fontScale='p2' color='default' style={style}>
				<MarkdownText content={name} parseEmoji={true} variant='inline' />
			</TableCell>
			<TableCell fontScale='p2' color='default' style={style}>
				{statusType}
			</TableCell>
		</TableRow>
	);
};

export default CustomUserStatusRow;
