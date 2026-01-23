import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryObj } from '@storybook/react';

import { useFullStartDate } from './useFullStartDate';

const FullStartDate = ({ date }: { date: Date }) => {
	return <div>{useFullStartDate(date)}</div>;
};

const meta = {
	title: 'V2/Views/CallHistoryContextualbar/useFullStartDate',
	component: FullStartDate,
} satisfies Meta<typeof FullStartDate>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	decorators: [mockAppRoot().withDefaultLanguage('en-US').buildStoryDecorator()],
	args: {
		date: new Date('2025-02-07T12:00:00.000Z'),
	},
};

export const Spanish: Story = {
	decorators: [mockAppRoot().withDefaultLanguage('es-ES').buildStoryDecorator()],
	args: {
		date: new Date('2025-07-07T12:00:00.000Z'),
	},
};

export const French: Story = {
	decorators: [mockAppRoot().withDefaultLanguage('fr-FR').buildStoryDecorator()],
	args: {
		date: new Date('2025-08-22T12:00:00.000Z'),
	},
};

export const German: Story = {
	decorators: [mockAppRoot().withDefaultLanguage('de-DE').buildStoryDecorator()],
	args: {
		date: new Date('2025-11-11T12:00:00.000Z'),
	},
};

export const Japanese: Story = {
	decorators: [mockAppRoot().withDefaultLanguage('ja-JP').buildStoryDecorator()],
	args: {
		date: new Date('2025-12-16T12:00:00.000Z'),
	},
};
