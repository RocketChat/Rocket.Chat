import type { IPersonalAccessToken, Serialized } from '@rocket.chat/core-typings';
import { ButtonGroup, IconButton, TableRow, TableCell } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { FC } from 'react';
import React, { useCallback } from 'react';

import { useFormatDateAndTime } from '../../../../hooks/useFormatDateAndTime';

type AccountTokensRowProps = {
	isMedium: boolean;
	onRegenerate: (name: string) => void;
	onRemove: (name: string) => void;
} & Serialized<Pick<IPersonalAccessToken, 'name' | 'createdAt' | 'lastTokenPart' | 'bypassTwoFactor'>>;

const AccountTokensRow: FC<AccountTokensRowProps> = ({
	bypassTwoFactor,
	createdAt,
	isMedium,
	lastTokenPart,
	name,
	onRegenerate,
	onRemove,
}) => {
	const t = useTranslation();
	const formatDateAndTime = useFormatDateAndTime();
	const handleRegenerate = useCallback(() => onRegenerate(name), [name, onRegenerate]);
	const handleRemove = useCallback(() => onRemove(name), [name, onRemove]);

	return (
		<TableRow key={name} tabIndex={0} role='link' qa-token-name={name}>
			<TableCell withTruncatedText color='default' fontScale='p2m'>
				{name}
			</TableCell>
			{isMedium && <TableCell withTruncatedText>{formatDateAndTime(createdAt)}</TableCell>}
			<TableCell withTruncatedText>...{lastTokenPart}</TableCell>
			<TableCell withTruncatedText>{bypassTwoFactor ? t('Ignore') : t('Require')}</TableCell>
			<TableCell withTruncatedText>
				<ButtonGroup>
					<IconButton title={t('Refresh')} icon='refresh' small secondary onClick={handleRegenerate} />
					<IconButton title={t('Remove')} icon='trash' small secondary onClick={handleRemove} />
				</ButtonGroup>
			</TableCell>
		</TableRow>
	);
};

export default AccountTokensRow;
