import { Callout } from '@rocket.chat/fuselage';
import { ContextualbarSkeletonBody } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

import UserPresenceEditorForm from './UserPresenceEditorForm';
import { useManagedPresenceUser } from './useManagedPresenceUsers';

export type UserPresenceEditorFormWithDataProps = {
	username?: string;
	onClose: () => void;
};

const UserPresenceEditorFormWithData = ({ username, onClose }: UserPresenceEditorFormWithDataProps) => {
	const { t } = useTranslation();
	const { data, isLoading, isError } = useManagedPresenceUser(username);

	if (isLoading) {
		return <ContextualbarSkeletonBody />;
	}

	if (isError) {
		return <Callout type='danger'>{t('Error')}</Callout>;
	}

	return <UserPresenceEditorForm key={username} user={data ?? undefined} defaultUsername={username} onClose={onClose} />;
};

export default UserPresenceEditorFormWithData;
