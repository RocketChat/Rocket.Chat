import type { Meta, StoryObj } from '@storybook/react';

import FieldGroup from './FieldGroup.js';
import { Field, FieldHint, FieldLabel, FieldRow } from '../Field/index.js';
import { InputBoxSkeleton } from '../InputBox/index.js';

export default {
	title: 'Inputs/FieldGroup',
	component: FieldGroup,
} satisfies Meta<typeof FieldGroup>;

type Story = StoryObj<typeof FieldGroup>;

export const Default: Story = {
	render: () => (
		<FieldGroup>
			<Field>
				<FieldLabel>Field #1</FieldLabel>
				<FieldRow>
					<InputBoxSkeleton />
				</FieldRow>
			</Field>
			<Field>
				<FieldLabel>Field #2</FieldLabel>
				<FieldRow>
					<InputBoxSkeleton />
				</FieldRow>
				<FieldHint>Help text</FieldHint>
			</Field>
			<Field>
				<FieldLabel>Field #3</FieldLabel>
				<FieldRow>
					<InputBoxSkeleton />
				</FieldRow>
			</Field>
		</FieldGroup>
	),
};
