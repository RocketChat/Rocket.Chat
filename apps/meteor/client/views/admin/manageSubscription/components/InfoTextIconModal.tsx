import { IconButton } from '@rocket.chat/fuselage';
import { useSetModal } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { memo } from 'react';

import CardInfoModal from './CardInfoModal';

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
		setModal(<CardInfoModal title={title} text={infoText} close={() => setModal(null)} />);
	};

	return <IconButton icon='info' mini onClick={() => handleInfoClick()} />;
};

export default memo(InfoTextIconModal);
