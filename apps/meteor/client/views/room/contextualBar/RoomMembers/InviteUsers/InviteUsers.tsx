import { Callout } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

import VerticalBar from '../../../../../components/VerticalBar';
import EditInviteLink from './EditInviteLink';
import InviteLink from './InviteLink';

type InviteUsersProps = {
	onClickBackMembers: () => void;
	onClickBackLink: () => void;
	onClickNewLink: (daysAndMaxUses: { days: string; maxUses: string }) => void;
	onClose: () => void;
	isEditing: boolean;
	daysAndMaxUses: { days: string; maxUses: string };
	onClickEdit: () => void;
	captionText: string;
	linkText: string;
	error?: Error;
};

const InviteUsers = ({
	onClickBackMembers,
	onClickBackLink,
	onClickNewLink,
	onClose,
	isEditing,
	onClickEdit,
	daysAndMaxUses,
	captionText,
	linkText,
	error,
}: InviteUsersProps): ReactElement => {
	const t = useTranslation();

	return (
		<>
			<VerticalBar.Header>
				{(onClickBackMembers || onClickBackLink) && <VerticalBar.Back onClick={isEditing ? onClickBackLink : onClickBackMembers} />}
				<VerticalBar.Text>{t('Invite_Users')}</VerticalBar.Text>
				{onClose && <VerticalBar.Close onClick={onClose} />}
			</VerticalBar.Header>
			<VerticalBar.ScrollableContent>
				{error && <Callout type='danger'>{error.toString()}</Callout>}
				{isEditing && !error && <EditInviteLink onClickNewLink={onClickNewLink} daysAndMaxUses={daysAndMaxUses} />}
				{!isEditing && !error && <InviteLink captionText={captionText} onClickEdit={onClickEdit} linkText={linkText} />}
			</VerticalBar.ScrollableContent>
		</>
	);
};

export default InviteUsers;
