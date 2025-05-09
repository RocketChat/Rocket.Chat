import { States, StatesAction, StatesActions, StatesIcon, StatesSubtitle, StatesTitle } from '@rocket.chat/fuselage';
import type { Keys as IconName } from '@rocket.chat/icons';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

type OTRStatesProps = {
	title: string;
	description: string;
	icon: IconName;
	onClickStart: () => void;
};

const OTRStates = ({ title, description, icon, onClickStart }: OTRStatesProps): ReactElement => {
	const { t } = useTranslation();

	return (
		<States>
			<StatesIcon name={icon} />
			<StatesTitle>{title}</StatesTitle>
			<StatesSubtitle>{description}</StatesSubtitle>
			<StatesActions>
				<StatesAction onClick={onClickStart}>{t('New_OTR_Chat')}</StatesAction>
			</StatesActions>
		</States>
	);
};

export default OTRStates;
