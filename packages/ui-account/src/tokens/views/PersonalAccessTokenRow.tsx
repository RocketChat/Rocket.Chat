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
			<GenericTableCell withTruncatedText color='default' fontScale='p2m'>
				{name}
			</GenericTableCell>
			{isMedium && <GenericTableCell withTruncatedText>{formatDateAndTime(createdAt)}</GenericTableCell>}
			<GenericTableCell withTruncatedText>...{lastTokenPart}</GenericTableCell>
			<GenericTableCell withTruncatedText>{bypassTwoFactor ? t('Ignore') : t('Require')}</GenericTableCell>
			<GenericTableCell withTruncatedText>
				<ButtonGroup>
					<IconButton title={t('Refresh')} icon='refresh' small secondary onClick={() => onRegenerate(name)} />
					<IconButton title={t('Remove')} icon='trash' small secondary onClick={() => onRemove(name)} />
				</ButtonGroup>
			</GenericTableCell>
		</GenericTableRow>
	);
};

export default PersonalAccessTokenRow;
