import { IconButton } from '@rocket.chat/fuselage';
import { useSetModal } from '@rocket.chat/ui-contexts';
import type { ReactElement, ReactNode } from 'react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import GenericModal from '../../../../components/GenericModal';

type InfoTextIconModalProps = {
	title: string;
	infoText: ReactNode;
};

const InfoTextIconModal = ({ title, infoText }: InfoTextIconModalProps): ReactElement => {
	const setModal = useSetModal();
	const { t } = useTranslation();

	const handleInfoClick = () => {
		if (!infoText) {
			setModal(null);
			return;
		}
		setModal(
			<GenericModal icon='info' title={title} onClose={() => setModal(null)}>
				{infoText}
			</GenericModal>,
		);
	};

	return <IconButton icon='info' aria-label={t('Click_here_for_more_info')} mini onClick={() => handleInfoClick()} />;
};

export default memo(InfoTextIconModal);
