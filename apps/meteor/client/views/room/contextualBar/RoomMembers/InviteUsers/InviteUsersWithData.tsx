import type { IRoom } from '@rocket.chat/core-typings';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useEndpoint, useTranslation, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { useState, useEffect } from 'react';

import InviteUsers from './InviteUsers';
import InviteUsersEdit from './InviteUsersEdit';
import InviteUsersError from './InviteUsersError';
import InviteUsersLoading from './InviteUsersLoading';
import { useFormatDateAndTime } from '../../../../../hooks/useFormatDateAndTime';
import { useRoomToolbox } from '../../../contexts/RoomToolboxContext';

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
			daysAndMaxUses: { days, maxUses },
		},
		setInviteState,
	] = useState({
		isEditing: false,
		daysAndMaxUses: { days: '1', maxUses: '0' },
	});

	const { closeTab } = useRoomToolbox();
	const format = useFormatDateAndTime();
	const findOrCreateInvite = useEndpoint('POST', '/v1/findOrCreateInvite');

	const handleEdit = useEffectEvent(() => setInviteState((prevState) => ({ ...prevState, isEditing: true })));
	const handleBackToLink = useEffectEvent(() => setInviteState((prevState) => ({ ...prevState, isEditing: false })));

	const linkExpirationText = useEffectEvent(
		(data?: {
			days: number;
			maxUses: number;
			rid: string;
			userId: string;
			createdAt: string;
			expires: string | null;
			uses: number;
			url: string;
			_id: string;
			_updatedAt: string;
		}) => {
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
		},
	);

	const { data, isSuccess, error, isError, isLoading } = useQuery({
		queryKey: ['findOrCreateInvite', days, maxUses],
		queryFn: async () => findOrCreateInvite({ rid, days: Number(days), maxUses: Number(maxUses) }),
	});

	useEffect(() => {
		if (isSuccess) {
			dispatchToastMessage({ type: 'success', message: t('Invite_link_generated') });
		}
	}, [dispatchToastMessage, isSuccess, t]);

	const handleGenerateLink = useEffectEvent((daysAndMaxUses: { days: string; maxUses: string }) => {
		setInviteState((prevState) => ({ ...prevState, daysAndMaxUses, isEditing: false }));
	});

	if (isError) {
		return <InviteUsersError error={error} onClose={closeTab} onClickBack={onClickBack} />;
	}

	if (isLoading) {
		return <InviteUsersLoading onClose={closeTab} onClickBack={onClickBack} />;
	}

	if (isEditing) {
		return (
			<InviteUsersEdit
				daysAndMaxUses={{ days, maxUses }}
				onClickBackLink={handleBackToLink}
				onClickNewLink={handleGenerateLink}
				onClose={closeTab}
			/>
		);
	}

	if (isSuccess) {
		return (
			<InviteUsers
				linkText={data.url}
				captionText={linkExpirationText(data)}
				onClose={closeTab}
				onClickBackMembers={onClickBack}
				onClickEdit={handleEdit}
			/>
		);
	}

	return <InviteUsersError error={new Error(t('Something_Went_Wrong'))} onClose={closeTab} onClickBack={onClickBack} />;
};

export default InviteUsersWithData;
