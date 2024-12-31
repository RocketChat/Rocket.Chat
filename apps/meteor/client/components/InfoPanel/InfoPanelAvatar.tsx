import type { ReactNode } from 'react';

import Section from './InfoPanelSection';

type InfoPanelAvatarProps = {
	children?: ReactNode;
};

const InfoPanelAvatar = ({ children }: InfoPanelAvatarProps) => (
	<Section display='flex' justifyContent='center'>
		{children}
	</Section>
);

export default InfoPanelAvatar;
