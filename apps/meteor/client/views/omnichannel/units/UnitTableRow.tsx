import { IconButton } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { GenericTableCell, GenericTableRow } from '@rocket.chat/ui-client';
import { useRouter } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import { useRemoveUnit } from './useRemoveUnit';

const UnitsTableRow = ({ _id, name, visibility }: { _id: string; name: string; visibility: string }) => {
	const { t } = useTranslation();
	const router = useRouter();

	const onRowClick = useEffectEvent((id: string) => () => router.navigate(`/omnichannel/units/edit/${id}`));
	const handleDelete = useRemoveUnit(_id);

	return (
		<GenericTableRow key={_id} tabIndex={0} role='link' data-qa-id={name} onClick={onRowClick(_id)} action qa-user-id={_id}>
			<GenericTableCell withTruncatedText>{name}</GenericTableCell>
			<GenericTableCell withTruncatedText>{visibility}</GenericTableCell>
			<GenericTableCell>
				<IconButton
					icon='trash'
					small
					title={t('Remove')}
					data-qa-id={`remove-unit-${name}`}
					onClick={(e) => {
						e.stopPropagation();
						handleDelete();
					}}
				/>
			</GenericTableCell>
		</GenericTableRow>
	);
};

export default UnitsTableRow;
