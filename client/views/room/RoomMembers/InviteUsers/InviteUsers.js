import React, { useState, useEffect } from 'react';
import { Box, Field, UrlInput, Icon, Button, InputBox, Callout } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import useClipboard from '../../../../hooks/useClipboard';
import VerticalBar from '../../../../components/basic/VerticalBar';
import { useTranslation } from '../../../../contexts/TranslationContext';
import { useEndpoint } from '../../../../contexts/ServerContext';
import { useFormatDateAndTime } from '../../../../hooks/useFormatDateAndTime';
import EditInvite from '../EditInvite';

export const InviteUsers = ({
	onClickBack,
	onClickClose,
	onClickEdit,
	captionText,
	linkText,
	error,
}) => {
	const t = useTranslation();

	const onClickCopy = useClipboard(linkText);

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
						{linkText === undefined ? <InputBox.Skeleton /> : <UrlInput value={linkText} addon={<Icon onClick={onClickCopy} name='copy' size='x16'/>}/>}
					</Field.Row>
				</Field>

				<Box pb='x8' color='neutral-600' fontScale='c2'>{captionText}</Box>

				{ error && <Callout mi='x24' type='danger'>{error.toString()}</Callout>}

				<Box pb='x16'>
					{onClickEdit && <Button onClick={onClickEdit}>{t('Edit_Invite')}</Button>}
				</Box>
			</VerticalBar.ScrollableContent>
		</>
	);
};

export default ({
	rid,
	tabBar,
	onClickBack,
}) => {
	const [editing, setEditing] = useState(false);
	const format = useFormatDateAndTime();
	const t = useTranslation();

	const onClickClose = useMutableCallback(() => tabBar && tabBar.close());

	const handleEdit = useMutableCallback(() => setEditing(true));
	const onClickBackEditing = useMutableCallback(() => setEditing(false));

	const findOrCreateInvite = useEndpoint('POST', 'findOrCreateInvite');

	const [{ days = 1, maxUses = 0 }, setDayAndMaxUses] = useState({});


	const setParams = useMutableCallback((args) => {
		setDayAndMaxUses(args);
		setEditing(false);
	});

	const [state, setState] = useState();

	const linkExpirationText = useMutableCallback((data) => {
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
	});

	useEffect(() => {
		if (editing) {
			return;
		}
		(async () => {
			try {
				const data = await findOrCreateInvite({ rid, days, maxUses });
				setState({
					url: data.url,
					caption: linkExpirationText(data),
				});
			} catch (error) {
				setState({ error });
			}
		})();
	}, [findOrCreateInvite, editing, linkExpirationText, rid, days, maxUses]);


	if (editing) {
		return <EditInvite
			onClickBack={onClickBackEditing}
			linkText={state?.url}
			captionText={state?.caption}
			{...{ rid, tabBar, error: state?.error, setParams, days, maxUses }}
		/>;
	}

	return (
		<InviteUsers
			error={state?.error}
			onClickClose={onClickClose}
			onClickBack={onClickBack}
			onClickEdit={handleEdit}
			linkText={state?.url}
			captionText={state?.caption}
		/>
	);
};
