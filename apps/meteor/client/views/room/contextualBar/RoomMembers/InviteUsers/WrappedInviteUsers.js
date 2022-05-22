import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useState, useEffect } from 'react';

import { useFormatDateAndTime } from '../../../../../hooks/useFormatDateAndTime';
import { useTabBarClose } from '../../../providers/ToolboxProvider';
import EditInvite from '../EditInvite';
import InviteUsers from './InviteUsers';

const WrappedInviteUsers = ({ rid, tabBar, onClickBack }) => {
	const [editing, setEditing] = useState(false);
	const format = useFormatDateAndTime();
	const t = useTranslation();

	const onClickClose = useTabBarClose();

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
		return (
			<EditInvite
				onClickBack={onClickBackEditing}
				linkText={state?.url}
				captionText={state?.caption}
				{...{ rid, tabBar, error: state?.error, setParams, days, maxUses }}
			/>
		);
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

export default WrappedInviteUsers;
