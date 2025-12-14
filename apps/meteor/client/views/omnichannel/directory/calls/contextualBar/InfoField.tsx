import { InfoPanelField, InfoPanelLabel, InfoPanelText } from '@rocket.chat/ui-client';
import type { ReactElement } from 'react';

type InfoFieldPropsType = {
	label: string;
	info: string;
};

export const InfoField = ({ label, info }: InfoFieldPropsType): ReactElement => (
	<InfoPanelField>
		<InfoPanelLabel>{label}</InfoPanelLabel>
		<InfoPanelText>{info}</InfoPanelText>
	</InfoPanelField>
);
