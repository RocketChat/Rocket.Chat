import { Callout } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import {
	ContextualbarHeader,
	ContextualbarTitle,
	ContextualbarBack,
	ContextualbarClose,
	ContextualbarScrollableContent,
} from '../../../../../components/Contextualbar';
import EditInviteLink from './EditInviteLink';
import InviteLink from './InviteLink';

type InviteUsersProps = {
	onClickBackMembers?: () => void;
	onClickBackLink?: () => void;
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
			<ContextualbarHeader>
				{(onClickBackMembers || onClickBackLink) && <ContextualbarBack onClick={isEditing ? onClickBackLink : onClickBackMembers} />}
				<ContextualbarTitle>{t('Invite_Users')}</ContextualbarTitle>
				{onClose && <ContextualbarClose onClick={onClose} />}
			</ContextualbarHeader>
			<ContextualbarScrollableContent>
				{error && <Callout type='danger'>{error.toString()}</Callout>}
				{isEditing && !error && <EditInviteLink onClickNewLink={onClickNewLink} daysAndMaxUses={daysAndMaxUses} />}
				{!isEditing && !error && <InviteLink captionText={captionText} onClickEdit={onClickEdit} linkText={linkText} />}
			</ContextualbarScrollableContent>
		</>
	);
};

export default InviteUsers;
