import { IconButton } from '@rocket.chat/fuselage';
import { useSetModal } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { memo } from 'react';

import GenericModal from '../../../../components/GenericModal';

export type InfoTextIconModalProps = {
	title: string;
	infoText: string;
};

const InfoTextIconModal = ({ title, infoText }: InfoTextIconModalProps): ReactElement => {
	const setModal = useSetModal();

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

	return <IconButton icon='info' mini onClick={() => handleInfoClick()} />;
};

export default memo(InfoTextIconModal);
