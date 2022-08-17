import { Box, Field, UrlInput, Icon, Button, InputBox, Callout } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import VerticalBar from '../../../../../components/VerticalBar';
import useClipboardWithToast from '../../../../../hooks/useClipboardWithToast';

const InviteUsers = ({ onClickBack, onClickClose, onClickEdit, captionText, linkText, error }) => {
	const t = useTranslation();

	const { copy } = useClipboardWithToast(linkText);

	return (
		<>
			<VerticalBar.Header>
				{onClickBack && <VerticalBar.Back onClick={onClickBack} />}
				<VerticalBar.Text>{t('Invite_Users')}</VerticalBar.Text>
				{onClickClose && <VerticalBar.Close onClick={onClickClose} />}
			</VerticalBar.Header>

			<VerticalBar.ScrollableContent>
				<Field>
					<Field.Label flexGrow={0}>{t('Invite_Link')}</Field.Label>
					<Field.Row>
						{linkText === undefined ? (
							<InputBox.Skeleton />
						) : (
							<UrlInput value={linkText} addon={<Icon onClick={copy} name='copy' size='x16' />} />
						)}
					</Field.Row>
				</Field>

				<Box pb='x8' color='neutral-600' fontScale='c2'>
					{captionText}
				</Box>

				{error && (
					<Callout mi='x24' type='danger'>
						{error.toString()}
					</Callout>
				)}

				<Box pb='x16'>{onClickEdit && <Button onClick={onClickEdit}>{t('Edit_Invite')}</Button>}</Box>
			</VerticalBar.ScrollableContent>
		</>
	);
};

export default InviteUsers;
