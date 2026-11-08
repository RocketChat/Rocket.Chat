import { Tile } from '@rocket.chat/fuselage';
import type { Meta, StoryFn } from '@storybook/react-webpack5';

import FormPageLayout from './FormPageLayout';

export default {
	title: 'common/FormPageLayout',
	component: FormPageLayout,
	parameters: {
		layout: 'fullscreen',
		actions: { argTypesRegex: '^on.*' },
	},
	args: {
		title: <Tile>Title</Tile>,
		subtitle: <Tile>Subtitle</Tile>,
		description: <Tile>Description</Tile>,
		children: <Tile>Form</Tile>,
	},
} satisfies Meta<typeof FormPageLayout>;

export const _FormPageLayout: StoryFn<typeof FormPageLayout> = (args) => <FormPageLayout {...args} />;
_FormPageLayout.storyName = 'FormPageLayout';
