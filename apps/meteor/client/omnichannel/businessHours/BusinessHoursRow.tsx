import type { ILivechatBusinessHour, Serialized } from '@rocket.chat/core-typings';
import { IconButton } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useRouter } from '@rocket.chat/ui-contexts';
import type { KeyboardEvent } from 'react';
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useRemoveBusinessHour } from './useRemoveBusinessHour';
import { GenericTableRow, GenericTableCell } from '../../components/GenericTable';

const BusinessHoursRow = ({ _id, name, timezone, workHours, active, type }: Serialized<ILivechatBusinessHour>) => {
	const { t } = useTranslation();
	const router = useRouter();
	const handleRemove = useRemoveBusinessHour();

	const handleClick = () => router.navigate(`/omnichannel/businessHours/edit/${type}/${_id}`);

	const handleKeyDown = (e: KeyboardEvent<HTMLElement>) => {
		if (!['Enter', 'Space'].includes(e.nativeEvent.code)) {
			return;
		}

		handleClick();
	};

	const openDays = useMemo(() => workHours.filter(({ open }) => !!open).map(({ day }) => day), [workHours]);

	return (
		<GenericTableRow key={_id} role='link' action tabIndex={0} onClick={handleClick} onKeyDown={handleKeyDown}>
			<GenericTableCell withTruncatedText>{name || t('Default')}</GenericTableCell>
			<GenericTableCell withTruncatedText>{t(timezone.name as TranslationKey)}</GenericTableCell>
			<GenericTableCell withTruncatedText>{openDays.join(', ')}</GenericTableCell>
			<GenericTableCell withTruncatedText>{active ? t('Yes') : t('No')}</GenericTableCell>
			<GenericTableCell withTruncatedText>
				{name && (
					<IconButton
						icon='trash'
						small
						title={t('Remove')}
						onClick={(e) => {
							e.stopPropagation();
							handleRemove(_id, type);
						}}
					/>
				)}
			</GenericTableCell>
		</GenericTableRow>
	);
};

export default memo(BusinessHoursRow);
