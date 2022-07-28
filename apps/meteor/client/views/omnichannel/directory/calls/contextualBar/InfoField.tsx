import React, { ReactElement } from 'react';

import InfoPanel from '../../../../InfoPanel';

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
