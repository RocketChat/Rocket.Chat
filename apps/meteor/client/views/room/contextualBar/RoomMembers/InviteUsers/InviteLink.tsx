import { Box, Field, UrlInput, Icon, Button, InputBox } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import useClipboardWithToast from '../../../../../hooks/useClipboardWithToast';

type InviteLinkProps = {
	linkText: string;
	captionText: string;
	onClickEdit: () => void;
};

const InviteLink = ({ linkText, captionText, onClickEdit }: InviteLinkProps): ReactElement => {
	const t = useTranslation();
	const { copy } = useClipboardWithToast(linkText);

	return (
		<>
			<Field>
				<Field.Label flexGrow={0}>{t('Invite_Link')}</Field.Label>
				<Field.Row>
					{!linkText && <InputBox.Skeleton />}
					{linkText && <UrlInput value={linkText} addon={<Icon onClick={(): Promise<void> => copy()} name='copy' size='x16' />} />}
				</Field.Row>
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
