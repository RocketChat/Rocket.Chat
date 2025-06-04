import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import {
	ContextualbarHeader,
	ContextualbarTitle,
	ContextualbarBack,
	ContextualbarClose,
	ContextualbarScrollableContent,
	ContextualbarDialog,
} from '../../../../../components/Contextualbar';

type InviteUsersWrapperProps = {
	children: ReactElement;
	onClickBack: (() => void) | undefined;
	onClose: () => void;
};

const InviteUsersWrapper = ({ children, onClickBack, onClose }: InviteUsersWrapperProps): ReactElement => {
	const { t } = useTranslation();

	return (
		<ContextualbarDialog>
			<ContextualbarHeader>
				<ContextualbarBack onClick={onClickBack} />
				<ContextualbarTitle>{t('Invite_Users')}</ContextualbarTitle>
				<ContextualbarClose onClick={onClose} />
			</ContextualbarHeader>
			<ContextualbarScrollableContent>{children}</ContextualbarScrollableContent>
		</ContextualbarDialog>
	);
};

export default InviteUsersWrapper;
