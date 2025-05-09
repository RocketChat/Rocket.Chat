import type { Meta, StoryFn } from '@storybook/react';

import DialPadModal from './DialPadModal';

export default {
	title: 'Components/VoIP/Modal/DialPadModal',
	component: DialPadModal,
} satisfies Meta<typeof DialPadModal>;

export const Default: StoryFn<typeof DialPadModal> = () => <DialPadModal handleClose={(): void => undefined} />;
Default.storyName = 'DialPadModal';
