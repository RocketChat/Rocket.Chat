import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import EditInviteLink from './EditInviteLink';
import InviteLink from './InviteLink';
import {
	ContextualbarHeader,
	ContextualbarTitle,
	ContextualbarBack,
	ContextualbarClose,
	ContextualbarScrollableContent,
} from '../../../../../components/Contextualbar';

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
}: InviteUsersProps): ReactElement => {
	const { t } = useTranslation();

	return (
		<>
			<ContextualbarHeader>
				{(onClickBackMembers || onClickBackLink) && <ContextualbarBack onClick={isEditing ? onClickBackLink : onClickBackMembers} />}
				<ContextualbarTitle>{t('Invite_Users')}</ContextualbarTitle>
				{onClose && <ContextualbarClose onClick={onClose} />}
			</ContextualbarHeader>
			<ContextualbarScrollableContent>
				{isEditing && <EditInviteLink onClickNewLink={onClickNewLink} daysAndMaxUses={daysAndMaxUses} />}
				{!isEditing && <InviteLink captionText={captionText} onClickEdit={onClickEdit} linkText={linkText} />}
			</ContextualbarScrollableContent>
		</>
	);
};

export default InviteUsers;
