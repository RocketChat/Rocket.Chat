import React, { FC } from 'react';

import Section from './InfoPanelSection';

const InfoPanelAvatar: FC = ({ children }) => (
	<Section display='flex' justifyContent='center'>
		{children}
	</Section>
);

export default InfoPanelAvatar;
