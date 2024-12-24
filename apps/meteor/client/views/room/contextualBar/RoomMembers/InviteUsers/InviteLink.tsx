import { Box, Field, FieldLabel, FieldRow, UrlInput, Icon, Button, InputBox } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import useClipboardWithToast from '../../../../../hooks/useClipboardWithToast';

type InviteLinkProps = {
	linkText: string;
	captionText: string;
	onClickEdit: () => void;
};

const InviteLink = ({ linkText, captionText, onClickEdit }: InviteLinkProps): ReactElement => {
	const { t } = useTranslation();
	const { copy } = useClipboardWithToast(linkText);

	return (
		<>
			<Field>
				<FieldLabel flexGrow={0}>{t('Invite_Link')}</FieldLabel>
				<FieldRow>
					{!linkText && <InputBox.Skeleton />}
					{linkText && <UrlInput value={linkText} addon={<Icon onClick={(): Promise<void> => copy()} name='copy' size='x16' />} />}
				</FieldRow>
				{captionText && (
					<Box pb={8} color='annotation' fontScale='c2'>
						{captionText}
					</Box>
				)}
			</Field>
			{onClickEdit && (
				<Box mbs={8}>
					<Button onClick={onClickEdit}>{t('Edit_Invite')}</Button>
				</Box>
			)}
		</>
	);
};

export default InviteLink;
