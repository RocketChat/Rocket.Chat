import { ButtonGroup, IconButton } from '@rocket.chat/fuselage';
import { GenericTableRow, GenericTableCell, useFormatDateAndTime } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

import type { PersonalAccessToken } from '../logic/personalAccessTokens';

type PersonalAccessTokenRowProps = {
	token: PersonalAccessToken;
	isMedium: boolean;
	onRegenerate: (name: string) => void;
	onRemove: (name: string) => void;
};

const PersonalAccessTokenRow = ({
	token: { name, createdAt, lastTokenPart, bypassTwoFactor },
	isMedium,
	onRegenerate,
	onRemove,
}: PersonalAccessTokenRowProps) => {
	const { t } = useTranslation();
	const formatDateAndTime = useFormatDateAndTime();

	return (
		<GenericTableRow tabIndex={0} role='link' qa-token-name={name}>
			<GenericTableCell truncate color='default' strong>
				{name}
			</GenericTableCell>
			{isMedium && <GenericTableCell truncate>{formatDateAndTime(createdAt)}</GenericTableCell>}
			<GenericTableCell truncate>...{lastTokenPart}</GenericTableCell>
			<GenericTableCell truncate>{bypassTwoFactor ? t('Ignore') : t('Require')}</GenericTableCell>
			<GenericTableCell truncate>
				<ButtonGroup>
					<IconButton title={t('Refresh')} icon='refresh' size='small' variant='secondary' onClick={() => onRegenerate(name)} />
					<IconButton title={t('Remove')} icon='trash' size='small' variant='secondary' onClick={() => onRemove(name)} />
				</ButtonGroup>
			</GenericTableCell>
		</GenericTableRow>
	);
};

export default PersonalAccessTokenRow;
