import { Button, ButtonGroup } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

type OTREstablishedProps = {
	onClickRefresh: () => void;
	onClickEnd: () => void;
};

const OTREstablished = ({ onClickRefresh, onClickEnd }: OTREstablishedProps): ReactElement => {
	const { t } = useTranslation();

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
