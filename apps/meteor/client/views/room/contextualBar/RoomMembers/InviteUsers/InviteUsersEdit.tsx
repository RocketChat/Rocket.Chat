import type { ReactElement } from 'react';

import EditInviteLink from './EditInviteLink';
import InviteUsersWrapper from './InviteUsersWrapper';

type InviteUsersEditProps = {
	onClickBackLink?: () => void;
	onClickNewLink: (daysAndMaxUses: { days: string; maxUses: string }) => void;
	onClose: () => void;
	daysAndMaxUses: { days: string; maxUses: string };
};

const InviteUsersEdit = ({ onClickBackLink, onClickNewLink, onClose, daysAndMaxUses }: InviteUsersEditProps): ReactElement => {
	return (
		<InviteUsersWrapper onClickBack={onClickBackLink} onClose={onClose}>
			<EditInviteLink onClickNewLink={onClickNewLink} daysAndMaxUses={daysAndMaxUses} />
		</InviteUsersWrapper>
	);
};

export default InviteUsersEdit;
