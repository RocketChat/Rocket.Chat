import InviteLink from './InviteLink';
import InviteUsersWrapper from './InviteUsersWrapper';

export type InviteUsersProps = {
	onClickBackMembers?: () => void;
	onClose: () => void;
	onClickEdit: () => void;
	captionText: string;
	linkText: string;
};

const InviteUsers = ({ onClickBackMembers, onClose, onClickEdit, captionText, linkText }: InviteUsersProps) => (
	<InviteUsersWrapper onClickBack={onClickBackMembers} onClose={onClose}>
		<InviteLink captionText={captionText} onClickEdit={onClickEdit} linkText={linkText} />
	</InviteUsersWrapper>
);

export default InviteUsers;
