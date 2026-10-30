import { Icon, Tag } from '@rocket.chat/fuselage';
import { GenericTableCell, GenericTableRow } from '@rocket.chat/ui-client';
import type { KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { getPasskeyKind, getPasskeyKindLabel, passkeyKindIcons } from './describePasskey';
import PasskeyName from './layout/PasskeyName';
import type { PasskeyListItem } from './usePasskeys';
import { useFormatDate } from '../../../hooks/useFormatDate';
import { useTimeFromNow } from '../../../hooks/useTimeFromNow';

export type PasskeyRowProps = {
	passkey: PasskeyListItem;
	isMedium: boolean;
	onOpen: () => void;
};

const PasskeyRow = ({ passkey, isMedium, onOpen }: PasskeyRowProps) => {
	const { t } = useTranslation();
	const formatDate = useFormatDate();
	const timeFromNow = useTimeFromNow(true);
	const kind = getPasskeyKind(passkey);

	const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			onOpen();
		}
	};

	return (
		<GenericTableRow action tabIndex={0} aria-label={passkey.name} onClick={onOpen} onKeyDown={handleKeyDown}>
			<GenericTableCell>
				<PasskeyName
					icon={<Icon name={passkeyKindIcons[kind ?? 'unknown']} size='x20' />}
					name={passkey.name}
					tags={passkey.backedUp && <Tag title={t('Passkey_synced_description')}>{t('Synced')}</Tag>}
				/>
			</GenericTableCell>
			{isMedium && <GenericTableCell>{getPasskeyKindLabel(t, kind)}</GenericTableCell>}
			{isMedium && <GenericTableCell>{formatDate(passkey.createdAt)}</GenericTableCell>}
			<GenericTableCell>{passkey.lastUsedAt ? timeFromNow(passkey.lastUsedAt) : t('Never')}</GenericTableCell>
		</GenericTableRow>
	);
};

export default PasskeyRow;
