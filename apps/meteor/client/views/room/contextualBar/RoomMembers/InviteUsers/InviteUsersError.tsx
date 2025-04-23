import { Callout } from '@rocket.chat/fuselage';
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
	error: Error;
};

const InviteUsersError = ({ onClose, error }: InviteUsersProps): ReactElement => {
	const { t } = useTranslation();

	return (
		<>
			<ContextualbarHeader>
				<ContextualbarTitle>{t('Invite_Users')}</ContextualbarTitle>
				{onClose && <ContextualbarClose onClick={onClose} />}
			</ContextualbarHeader>
			<ContextualbarScrollableContent>
				<Callout type='danger'>{error.toString()}</Callout>
			</ContextualbarScrollableContent>
		</>
	);
};

export default InviteUsersError;
