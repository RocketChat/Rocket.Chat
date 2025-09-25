import type { Meta, StoryFn } from '@storybook/react';

import DialPadModal from './DialPadModal';

export default {
	component: DialPadModal,
} satisfies Meta<typeof DialPadModal>;

export const Default: StoryFn<typeof DialPadModal> = () => <DialPadModal handleClose={(): void => undefined} />;
Default.storyName = 'DialPadModal';
