import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryObj } from '@storybook/react';

import Location from './Location';
import MapViewImage from './location/MapViewImage';

const map = `data:image/svg+xml;utf8,${encodeURIComponent(
	'<svg xmlns="http://www.w3.org/2000/svg" width="250" height="250"><rect width="250" height="250" fill="#9ea2a8"/></svg>',
)}`;

const meta = {
	title: 'Components/Message/Content/Location',
	component: Location,
	decorators: [mockAppRoot().withTranslations('en', 'core', { Shared_Location: 'Shared location' }).buildStoryDecorator()],
	parameters: { layout: 'padded' },
	args: {
		location: { type: 'Point', coordinates: [-48.5482, -27.5969] },
	},
} satisfies Meta<typeof Location>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WithoutMapsKey: Story = {};

export const WithMapImage: Story = {
	render: () => <MapViewImage linkUrl='https://maps.google.com/maps?daddr=-27.5969,-48.5482' imageUrl={map} />,
};
