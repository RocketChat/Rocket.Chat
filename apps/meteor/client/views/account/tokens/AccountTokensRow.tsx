import { Button, ButtonGroup, Icon, Table } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { MomentInput } from 'moment';
import React, { useCallback, FC } from 'react';

import { useFormatDateAndTime } from '../../../hooks/useFormatDateAndTime';

type AccountTokensRowProps = {
	bypassTwoFactor: unknown;
	createdAt: MomentInput;
	isMedium: boolean;
	lastTokenPart: string;
	name: string;
	onRegenerate: (name: string) => void;
	onRemove: (name: string) => void;
};

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
		<Table.Row key={name} tabIndex={0} role='link' action qa-token-name={name}>
			<Table.Cell withTruncatedText color='default' fontScale='p2m'>
				{name}
			</Table.Cell>
			{isMedium && <Table.Cell withTruncatedText>{formatDateAndTime(createdAt)}</Table.Cell>}
			<Table.Cell withTruncatedText>...{lastTokenPart}</Table.Cell>
			<Table.Cell withTruncatedText>{bypassTwoFactor ? t('Ignore') : t('Require')}</Table.Cell>
			<Table.Cell withTruncatedText>
				<ButtonGroup>
					<Button onClick={handleRegenerate} small>
						<Icon name='refresh' size='x16' />
					</Button>
					<Button onClick={handleRemove} small>
						<Icon name='trash' size='x16' />
					</Button>
				</ButtonGroup>
			</Table.Cell>
		</Table.Row>
	);
};

export default AccountTokensRow;
