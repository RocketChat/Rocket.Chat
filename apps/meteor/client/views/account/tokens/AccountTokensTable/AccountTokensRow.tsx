import type { IPersonalAccessToken, Serialized } from '@rocket.chat/core-typings';
import { ButtonGroup, IconButton } from '@rocket.chat/fuselage';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { GenericTableRow, GenericTableCell } from '../../../../components/GenericTable';
import { useFormatDateAndTime } from '../../../../hooks/useFormatDateAndTime';

type AccountTokensRowProps = {
	isMedium: boolean;
	onRegenerate: (name: string) => void;
	onRemove: (name: string) => void;
} & Serialized<Pick<IPersonalAccessToken, 'name' | 'createdAt' | 'lastTokenPart' | 'bypassTwoFactor'>>;

const AccountTokensRow = ({ bypassTwoFactor, createdAt, isMedium, lastTokenPart, name, onRegenerate, onRemove }: AccountTokensRowProps) => {
	const { t } = useTranslation();
	const formatDateAndTime = useFormatDateAndTime();
	const handleRegenerate = useCallback(() => onRegenerate(name), [name, onRegenerate]);
	const handleRemove = useCallback(() => onRemove(name), [name, onRemove]);

	return (
		<GenericTableRow key={name} tabIndex={0} role='link' qa-token-name={name}>
			<GenericTableCell withTruncatedText color='default' fontScale='p2m'>
				{name}
			</GenericTableCell>
			{isMedium && <GenericTableCell withTruncatedText>{formatDateAndTime(createdAt)}</GenericTableCell>}
			<GenericTableCell withTruncatedText>...{lastTokenPart}</GenericTableCell>
			<GenericTableCell withTruncatedText>{bypassTwoFactor ? t('Ignore') : t('Require')}</GenericTableCell>
			<GenericTableCell withTruncatedText>
				<ButtonGroup>
					<IconButton title={t('Refresh')} icon='refresh' small secondary onClick={handleRegenerate} />
					<IconButton title={t('Remove')} icon='trash' small secondary onClick={handleRemove} />
				</ButtonGroup>
			</GenericTableCell>
		</GenericTableRow>
	);
};

export default AccountTokensRow;
