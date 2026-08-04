import { Callout } from '@rocket.chat/fuselage';

import InviteUsersWrapper from './InviteUsersWrapper';

export type InviteUsersErrorProps = {
	onClose: () => void;
	error: Error;
	onClickBack?: (() => void) | undefined;
};

const InviteUsersError = ({ onClose, error, onClickBack }: InviteUsersErrorProps) => (
	<InviteUsersWrapper onClose={onClose} onClickBack={onClickBack}>
		<Callout type='danger'>{(error || '').toString()}</Callout>
	</InviteUsersWrapper>
);

export default InviteUsersError;
