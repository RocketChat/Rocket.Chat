import type { Meta, StoryFn } from '@storybook/react-webpack5';

import LayoutLogoImage from './LayoutLogoImage';

export default {
	title: 'components/LayoutLogoImage',
	component: LayoutLogoImage,
} satisfies Meta<typeof LayoutLogoImage>;

export const Default: StoryFn<typeof LayoutLogoImage> = () => (
	<LayoutLogoImage
		src='data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="160" height="40"%3E%3Crect width="160" height="40" fill="%23f5455c"/%3E%3C/svg%3E'
		alt='Logo'
	/>
);
