import React, { useCallback, useState, useEffect } from 'react';
import { Box, Field, UrlInput, Icon, Button, InputBox } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import useClipboard from '../../../../hooks/useClipboard';
import VerticalBar from '../../../../components/basic/VerticalBar';
import { useTranslation } from '../../../../contexts/TranslationContext';
import { useEndpoint } from '../../../../contexts/ServerContext';
import { useFormatDateAndTime } from '../../../../hooks/useFormatDateAndTime';

export const InviteUsers = ({
	onClickBack,
	onClickClose,
	onClickEdit,
	captionText,
	linkText,
}) => {
	const t = useTranslation();

	const onClickCopy = useClipboard(linkText);

	const InviteCaption = () => <Box pb='x8' color='neutral-500' fontScale='c2'>{captionText}</Box>;

	return (
		<>
			<VerticalBar.Header>
				{onClickBack && <VerticalBar.Action onClick={onClickBack} name='arrow-back' />}
				<VerticalBar.Text>{t('Invite_Users')}</VerticalBar.Text>
				{onClickClose && <VerticalBar.Close onClick={onClickClose} />}
			</VerticalBar.Header>

			<VerticalBar.Content p='x12'>
				<Box width='full' pi='x12' pb='x12'>
					<Field>
						<Field.Label flexGrow={0}>{t('Invite_Link')}</Field.Label>
						<Field.Row>
							{linkText === undefined ? <InputBox.Skeleton /> : <UrlInput value={linkText} addon={<Icon onClick={onClickCopy} name='copy' size='x16'/>}/>}
						</Field.Row>
					</Field>

					<InviteCaption />

					<Box pb='x16'>
						{onClickEdit && <Button onClick={onClickEdit}>{t('Edit_Invite')}</Button>}
					</Box>
				</Box>
			</VerticalBar.Content>
		</>
	);
};

export default ({
	rid,
	tabBar,
}) => {
	const format = useFormatDateAndTime();
	const t = useTranslation();

	const onClickClose = useMutableCallback(() => tabBar && tabBar.close());
	const onClickBack = useMutableCallback(() => tabBar.setTemplate('membersList'));
	const handleEdit = useCallback(() => tabBar.setTemplate('EditInvite'), [tabBar]);
	const buildInviteLink = useEndpoint('POST', 'findOrCreateInvite');

	const [url, setUrl] = useState();
	const [caption, setCaption] = useState('');

	const linkExpirationText = useCallback((data) => {
		if (!data) {
			return '';
		}

		if (data.expires) {
			const expiration = new Date(data.expires);
			if (data.maxUses) {
				const usesLeft = data.maxUses - data.uses;
				return t('Your_invite_link_will_expire_on__date__or_after__usesLeft__uses', { date: format(expiration), usesLeft });
			}

			return t('Your_invite_link_will_expire_on__date__', { date: format(expiration) });
		}

		if (data.maxUses) {
			const usesLeft = data.maxUses - data.uses;
			return t('Your_invite_link_will_expire_after__usesLeft__uses', { usesLeft });
		}

		return t('Your_invite_link_will_never_expire');
	}, [format, t]);

	const handleInviteLink = useCallback(async () => {
		try {
			const data = await buildInviteLink({ rid });
			setUrl(data.url);
			setCaption(linkExpirationText(data));
		} catch (error) {
			console.log(error);
		}
	}, [buildInviteLink, linkExpirationText, rid]);

	useEffect(() => {
		handleInviteLink();
	}, [handleInviteLink]);

	return (
		<InviteUsers
			onClickClose={onClickClose}
			onClickBack={onClickBack}
			onClickEdit={handleEdit}
			linkText={url}
			captionText={caption}
		/>
	);
};
