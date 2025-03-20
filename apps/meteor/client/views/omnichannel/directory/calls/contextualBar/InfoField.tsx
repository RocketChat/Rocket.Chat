import type { ReactElement } from 'react';

import { InfoPanelField, InfoPanelLabel, InfoPanelText } from '../../../../../components/InfoPanel';

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
