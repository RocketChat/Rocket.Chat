import {
	ContextualbarHeader,
	ContextualbarTitle,
	ContextualbarBack,
	ContextualbarClose,
	ContextualbarScrollableContent,
	ContextualbarDialog,
} from '@rocket.chat/ui-client';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

type InviteUsersWrapperProps = {
	children: ReactNode;
	onClickBack: (() => void) | undefined;
	onClose: () => void;
};

const InviteUsersWrapper = ({ children, onClickBack, onClose }: InviteUsersWrapperProps) => {
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
