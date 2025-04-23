import { Skeleton } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import {
	ContextualbarHeader,
	ContextualbarTitle,
	ContextualbarClose,
	ContextualbarScrollableContent,
} from '../../../../../components/Contextualbar';

type InviteUsersProps = {
	onClose: () => void;
};

const InviteUsersLoading = ({ onClose }: InviteUsersProps): ReactElement => {
	const { t } = useTranslation();

	return (
		<>
			<ContextualbarHeader>
				<ContextualbarTitle>{t('Invite_Users')}</ContextualbarTitle>
				{onClose && <ContextualbarClose onClick={onClose} />}
			</ContextualbarHeader>
			<ContextualbarScrollableContent>
				<Skeleton w='full' />
			</ContextualbarScrollableContent>
		</>
	);
};

export default InviteUsersLoading;
