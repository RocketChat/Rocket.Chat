import { ContextualbarSkeletonBody } from '@rocket.chat/ui-client';

import UserPresenceEditorForm from './UserPresenceEditorForm';
import { useManagedPresenceUser } from './useManagedPresenceUsers';

export type UserPresenceEditorFormWithDataProps = {
	username?: string;
	onClose: () => void;
};

const UserPresenceEditorFormWithData = ({ username, onClose }: UserPresenceEditorFormWithDataProps) => {
	const { data, isLoading } = useManagedPresenceUser(username);

	if (isLoading) {
		return <ContextualbarSkeletonBody />;
	}

	return <UserPresenceEditorForm user={data ?? undefined} defaultUsername={username} onClose={onClose} />;
};

export default UserPresenceEditorFormWithData;
