import { Icon, States, StatesAction, StatesActions, StatesIcon, StatesSubtitle, StatesTitle } from '@rocket.chat/fuselage';
import React, { ReactElement, ComponentProps } from 'react';

import { useTranslation } from '../../../../../contexts/TranslationContext';

type OTRStatesProps = {
	title: string;
	description: string;
	icon: ComponentProps<typeof Icon>['name'];
	onClickStart: () => void;
};

const OTRStates = ({ title, description, icon, onClickStart }: OTRStatesProps): ReactElement => {
	const t = useTranslation();

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
