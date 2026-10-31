import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { FeaturePreviewProps } from '@rocket.chat/ui-client';
import type { Meta, StoryObj } from '@storybook/react';

import FeaturePreviewView from './FeaturePreviewView';

const features: FeaturePreviewProps[] = [
	{
		name: 'secondarySidebar',
		i18n: 'Filters_and_secondary_sidebar',
		description: 'Filters_and_secondary_sidebar_description',
		group: 'Navigation',
		value: true,
		enabled: true,
	},
	{
		name: 'sidebarRail',
		i18n: 'Sidebar_rail',
		description: 'Sidebar_rail_description',
		group: 'Navigation',
		value: false,
		enabled: true,
		enableQuery: { name: 'secondarySidebar', value: false },
	},
	{
		name: 'roomToolboxLayout',
		i18n: 'Room_Toolbox_Layout',
		description: 'Room_Toolbox_Layout_description',
		group: 'Room',
		value: false,
		enabled: true,
	},
];

const meta = {
	component: FeaturePreviewView,
	parameters: {
		layout: 'fullscreen',
	},
	decorators: [
		mockAppRoot()
			.withTranslations('en', 'core', {
				Feature_preview: 'Feature preview',
				No_feature_to_preview: 'No feature to preview',
				Feature_preview_page_description:
					'Welcome to the features preview page! Here, you can enable the latest cutting-edge features that are currently under development and not yet officially released.',
				Feature_preview_page_callout: 'Feature previews are being tested and may not work as expected.',
				Navigation: 'Navigation',
				Room: 'Room',
				Filters_and_secondary_sidebar: 'Filters and secondary sidebar',
				Filters_and_secondary_sidebar_description: 'Stay on top of important conversations.',
				Sidebar_rail: 'Sidebar rail',
				Sidebar_rail_description: 'A compact sidebar.',
				Room_Toolbox_Layout: 'Room toolbox layout',
				Room_Toolbox_Layout_description: 'A new layout for the room toolbox.',
				Cancel: 'Cancel',
				Save_changes: 'Save changes',
			})
			.buildStoryDecorator(),
		(Story) => <Story />,
	],
} satisfies Meta<typeof FeaturePreviewView>;

export default meta;

type Story = StoryObj<typeof meta>;

const save = async () => undefined;

export const Default: Story = {
	args: { vm: { features, save } },
};

export const NoFeatures: Story = {
	args: { vm: { features: [], save } },
};
