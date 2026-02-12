import { ButtonGroup } from '@rocket.chat/fuselage';
import type { ComponentPropsWithoutRef } from 'react';

import Section from './InfoPanelSection';

type InfoPanelActionGroupProps = ComponentPropsWithoutRef<typeof ButtonGroup>;

const InfoPanelActionGroup = (props: InfoPanelActionGroupProps) => (
	<Section>
		<ButtonGroup align='center' stretch {...props} />
	</Section>
);

export default InfoPanelActionGroup;
