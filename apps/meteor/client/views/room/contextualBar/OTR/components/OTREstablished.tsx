import { Button, ButtonGroup } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

type OTREstablishedProps = {
	onClickRefresh: () => void;
	onClickEnd: () => void;
};

const OTREstablished = ({ onClickRefresh, onClickEnd }: OTREstablishedProps): ReactElement => {
	const t = useTranslation();

	return (
		<ButtonGroup stretch>
			<Button onClick={onClickRefresh}>{t('Refresh_keys')}</Button>
			<Button secondary danger onClick={onClickEnd}>
				{t('End_OTR')}
			</Button>
		</ButtonGroup>
	);
};

export default OTREstablished;
