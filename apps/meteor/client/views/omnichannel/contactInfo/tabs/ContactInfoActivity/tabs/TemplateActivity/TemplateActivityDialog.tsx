import { ContextualbarTitle } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import {
	ContextualbarBack,
	ContextualbarClose,
	ContextualbarDialog,
	ContextualbarHeader,
} from '../../../../../../../components/Contextualbar';

type TemplateActivityDialogProps = {
	children: ReactNode;
	onClickBack?: () => void;
	onClose: () => void;
};

const TemplateActivityDialog = ({ children, onClickBack, onClose }: TemplateActivityDialogProps) => {
	const { t } = useTranslation();
	return (
		<ContextualbarDialog>
			<ContextualbarHeader>
				<ContextualbarBack onClick={onClickBack} />
				<ContextualbarTitle>{t('Template')}</ContextualbarTitle>
				<ContextualbarClose onClick={onClose} />
			</ContextualbarHeader>
			{children}
		</ContextualbarDialog>
	);
};

export default TemplateActivityDialog;
