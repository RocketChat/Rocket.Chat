import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { Field, FieldHint, FieldLabel, FieldRow } from '../Field';
import { InputBoxSkeleton } from '../InputBox';
import FieldGroup from './FieldGroup';

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
