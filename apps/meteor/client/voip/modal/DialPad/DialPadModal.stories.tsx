import type { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import DialPadModal from './DialPadModal';

export default {
	title: 'Components/VoIP/Modal/DialPadModal',
	component: DialPadModal,
} as ComponentMeta<typeof DialPadModal>;

export const Default: ComponentStory<typeof DialPadModal> = () => <DialPadModal handleClose={(): void => undefined} />;
Default.storyName = 'DialPadModal';
