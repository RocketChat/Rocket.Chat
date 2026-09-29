import type { Meta, StoryFn } from '@storybook/react-webpack5';

import HeroLayout from './HeroLayout';
import HeroLayoutSubtitle from './HeroLayoutSubtitle';
import HeroLayoutTitle from './HeroLayoutTitle';

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
