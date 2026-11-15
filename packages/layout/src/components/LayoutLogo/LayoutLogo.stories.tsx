import type { Meta, StoryFn } from '@storybook/react-webpack5';

import LayoutLogo from './LayoutLogo';

export default {
	title: 'components/LayoutLogo',
	component: LayoutLogo,
} satisfies Meta<typeof LayoutLogo>;

export const Default: StoryFn<typeof LayoutLogo> = () => <LayoutLogo />;
