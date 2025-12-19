import type { LivechatPriorityWeight } from '@rocket.chat/core-typings';
import { GenericTableCell, GenericTableRow } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

import { PriorityIcon } from './PriorityIcon';

type PrioritiesTableRowProps = {
	id: string;
	name?: string;
	i18n: string;
	sortItem: LivechatPriorityWeight;
	dirty: boolean;
	onClick: () => void;
};

const PrioritiesTableRow = ({ id, name, i18n, sortItem, dirty, onClick }: PrioritiesTableRowProps) => {
	const { t } = useTranslation();
	return (
		<GenericTableRow tabIndex={0} role='link' onClick={onClick} action qa-row-id={id}>
			<GenericTableCell withTruncatedText>
				<PriorityIcon level={sortItem} />
			</GenericTableCell>
			<GenericTableCell withTruncatedText>{dirty ? name : t(i18n)}</GenericTableCell>
		</GenericTableRow>
	);
};

export default PrioritiesTableRow;
