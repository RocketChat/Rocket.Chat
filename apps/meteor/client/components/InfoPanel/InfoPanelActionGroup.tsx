import { ButtonGroup } from '@rocket.chat/fuselage';
import type { ComponentProps, FC } from 'react';
import React from 'react';

import Section from './InfoPanelSection';

const InfoPanelActionGroup: FC<ComponentProps<typeof ButtonGroup>> = (props) => (
	<Section>
		<ButtonGroup flexShrink={0} flexWrap='nowrap' withTruncatedText justifyContent='center' {...props} />
	</Section>
);

export default InfoPanelActionGroup;
