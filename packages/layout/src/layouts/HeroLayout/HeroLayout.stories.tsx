import type { Meta, StoryFn } from '@storybook/react-webpack5';

import HeroLayout from './HeroLayout.js';
import HeroLayoutSubtitle from './HeroLayoutSubtitle.js';
import HeroLayoutTitle from './HeroLayoutTitle.js';

export default {
	title: 'layouts/HeroLayout',
	component: HeroLayout,
} satisfies Meta<typeof HeroLayout>;

export const Default: StoryFn<typeof HeroLayout> = () => (
	<HeroLayout>
		<HeroLayoutTitle>Title</HeroLayoutTitle>
		<HeroLayoutSubtitle>Subtitle</HeroLayoutSubtitle>
	</HeroLayout>
);
