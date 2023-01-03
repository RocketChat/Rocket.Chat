import type { ReactElement } from 'react';
import React from 'react';

import InfoPanel from '../../../../../components/InfoPanel';

type InfoFieldPropsType = {
	label: string;
	info: string;
};

export const InfoField = ({ label, info }: InfoFieldPropsType): ReactElement => (
	<InfoPanel.Field>
		<InfoPanel.Label>{label}</InfoPanel.Label>
		<InfoPanel.Text>{info}</InfoPanel.Text>
	</InfoPanel.Field>
);
