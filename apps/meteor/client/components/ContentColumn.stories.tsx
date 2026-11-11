import { Field, FieldGroup, FieldLabel, FieldRow, TextInput } from '@rocket.chat/fuselage';
import { Page, PageHeader, PageScrollableContent } from '@rocket.chat/ui-client';
import type { Meta, StoryObj } from '@storybook/react';

import ContentColumn from './ContentColumn';

const meta = {
	component: ContentColumn,
	parameters: {
		layout: 'fullscreen',
	},
	decorators: [
		(Story) => (
			<Page>
				<PageHeader title='Page' />
				<PageScrollableContent>
					<Story />
				</PageScrollableContent>
			</Page>
		),
	],
	args: {
		children: (
			<FieldGroup>
				<Field>
					<FieldLabel htmlFor='content-column-name'>Name</FieldLabel>
					<FieldRow>
						<TextInput id='content-column-name' />
					</FieldRow>
				</Field>
				<Field>
					<FieldLabel htmlFor='content-column-email'>Email</FieldLabel>
					<FieldRow>
						<TextInput id='content-column-email' />
					</FieldRow>
				</Field>
			</FieldGroup>
		),
	},
} satisfies Meta<typeof ContentColumn>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Form: Story = {};

export const Wide: Story = {
	args: {
		size: 'wide',
	},
};
