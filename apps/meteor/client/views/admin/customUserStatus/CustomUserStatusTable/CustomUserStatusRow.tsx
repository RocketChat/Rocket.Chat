import type { IUserStatus } from '@rocket.chat/core-typings';
import { GenericTableRow, GenericTableCell } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

import MarkdownText from '../../../../components/MarkdownText';

export type CustomUserStatusRowProps = {
	status: IUserStatus;
	onClick: (id: string) => void;
};

const CustomUserStatusRow = ({ status, onClick }: CustomUserStatusRowProps) => {
	const { _id, name, statusType } = status;
	const { t } = useTranslation();

	return (
		<GenericTableRow key={_id} onKeyDown={() => onClick(_id)} onClick={() => onClick(_id)} tabIndex={0} action>
			<GenericTableCell color='default' truncate>
				<MarkdownText content={name} parseEmoji={true} variant='inline' />
			</GenericTableCell>
			<GenericTableCell color='default' truncate>
				{t(statusType)}
			</GenericTableCell>
		</GenericTableRow>
	);
};

export default CustomUserStatusRow;
