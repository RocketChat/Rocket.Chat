import { Skeleton } from '@rocket.chat/fuselage';

import InviteUsersWrapper from './InviteUsersWrapper';

type InviteUsersProps = {
	onClose: () => void;
	onClickBack: (() => void) | undefined;
};

const InviteUsersLoading = ({ onClose, onClickBack: onClickBackMembers }: InviteUsersProps) => (
	<InviteUsersWrapper onClose={onClose} onClickBack={onClickBackMembers}>
		<Skeleton w='full' />
	</InviteUsersWrapper>
);

export default InviteUsersLoading;
