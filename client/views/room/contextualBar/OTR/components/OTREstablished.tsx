import { Button, ButtonGroup } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

import { useTranslation } from '../../../../../contexts/TranslationContext';

type OTREstablishedProps = {
	onClickRefresh: () => void;
	onClickEnd: () => void;
};

const OTREstablished: FC<OTREstablishedProps> = ({ onClickRefresh, onClickEnd }) => {
	const t = useTranslation();

	return (
		<ButtonGroup stretch>
			<Button width='50%' onClick={onClickRefresh}>
				{t('Refresh_keys')}
			</Button>
			<Button width='50%' danger onClick={onClickEnd}>
				{t('End_OTR')}
			</Button>
		</ButtonGroup>
	);
};

export default OTREstablished;
