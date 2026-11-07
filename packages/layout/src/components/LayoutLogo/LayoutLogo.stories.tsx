import type { Meta, StoryFn } from '@storybook/react-webpack5';

import LayoutLogo from './LayoutLogo.js';

export default {
	title: 'components/LayoutLogo',
	component: LayoutLogo,
} satisfies Meta<typeof LayoutLogo>;

export const Default: StoryFn<typeof LayoutLogo> = () => <LayoutLogo />;
