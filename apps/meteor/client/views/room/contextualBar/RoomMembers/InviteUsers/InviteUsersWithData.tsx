import { IRoom } from '@rocket.chat/core-typings';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useEndpoint, useTranslation, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import React, { useState, useEffect, ReactElement } from 'react';

import { useFormatDateAndTime } from '../../../../../hooks/useFormatDateAndTime';
import { useTabBarClose } from '../../../providers/ToolboxProvider';
import InviteUsers from './InviteUsers';

type InviteUsersWithDataProps = {
	rid: IRoom['_id'];
	onClickBack: () => void;
};

const InviteUsersWithData = ({ rid, onClickBack }: InviteUsersWithDataProps): ReactElement => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const [
		{
			isEditing,
			url,
			caption,
			error,
			daysAndMaxUses: { days, maxUses },
		},
		setInviteState,
	] = useState({
		isEditing: false,
		daysAndMaxUses: { days: '1', maxUses: '0' },
		url: '',
		caption: '',
		error: undefined as Error | undefined,
	});

	const handleClose = useTabBarClose();
	const format = useFormatDateAndTime();
	const findOrCreateInvite = useEndpoint('POST', '/v1/findOrCreateInvite');

	const handleEdit = useMutableCallback(() => setInviteState((prevState) => ({ ...prevState, isEditing: true })));
	const handleBackToLink = useMutableCallback(() => setInviteState((prevState) => ({ ...prevState, isEditing: false })));

	const linkExpirationText = useMutableCallback((data) => {
		if (!data) {
			return '';
		}

		if (data.expires) {
			const expiration = new Date(data.expires);
			if (data.maxUses) {
				const usesLeft = data.maxUses - data.uses;
				return t('Your_invite_link_will_expire_on__date__or_after__usesLeft__uses', {
					date: format(expiration),
					usesLeft,
				});
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
		(async (): Promise<void> => {
			try {
				const data = await findOrCreateInvite({ rid, days: Number(days), maxUses: Number(maxUses) });
				setInviteState((prevState) => ({ ...prevState, url: data?.url, caption: linkExpirationText(data) }));
				dispatchToastMessage({ type: 'success', message: t('Invite_link_generated') });
			} catch (error) {
				setInviteState((prevState) => ({ ...prevState, error: error as Error }));
			}
		})();
	}, [dispatchToastMessage, t, findOrCreateInvite, linkExpirationText, rid, days, maxUses]);

	const handleGenerateLink = useMutableCallback((daysAndMaxUses) => {
		setInviteState((prevState) => ({ ...prevState, daysAndMaxUses, isEditing: false }));
	});

	return (
		<InviteUsers
			isEditing={isEditing}
			error={error}
			linkText={url}
			captionText={caption}
			daysAndMaxUses={{ days, maxUses }}
			onClose={handleClose}
			onClickBackMembers={onClickBack}
			onClickBackLink={handleBackToLink}
			onClickEdit={handleEdit}
			onClickNewLink={handleGenerateLink}
		/>
	);
};

export default InviteUsersWithData;
