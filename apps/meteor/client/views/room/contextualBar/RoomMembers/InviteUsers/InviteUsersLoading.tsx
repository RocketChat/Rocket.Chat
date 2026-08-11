import { Skeleton } from '@rocket.chat/fuselage';

import InviteUsersWrapper from './InviteUsersWrapper';

export type InviteUsersLoadingProps = {
	onClose: () => void;
	onClickBack: (() => void) | undefined;
};

const InviteUsersLoading = ({ onClose, onClickBack: onClickBackMembers }: InviteUsersLoadingProps) => (
	<InviteUsersWrapper onClose={onClose} onClickBack={onClickBackMembers}>
		<Skeleton width='full' />
	</InviteUsersWrapper>
);

export default InviteUsersLoading;
