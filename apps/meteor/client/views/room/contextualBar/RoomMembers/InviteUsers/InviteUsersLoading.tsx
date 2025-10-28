import { Skeleton } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';

import InviteUsersWrapper from './InviteUsersWrapper';

type InviteUsersProps = {
	onClose: () => void;
	onClickBack: (() => void) | undefined;
};

const InviteUsersLoading = ({ onClose, onClickBack: onClickBackMembers }: InviteUsersProps): ReactElement => (
	<InviteUsersWrapper onClose={onClose} onClickBack={onClickBackMembers}>
		<Skeleton w='full' />
	</InviteUsersWrapper>
);

export default InviteUsersLoading;
