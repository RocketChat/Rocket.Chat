import type { Meta, StoryObj } from '@storybook/react';
import { expect } from 'storybook/test';

import FieldGroup from './FieldGroup';
import { ariaSnapshot } from '../../testing/g0';
import { Field, FieldLabel, FieldRow } from '../Field';
import { TextInput } from '../TextInput';

// G0 characterization of the `disabled` variation FieldGroup declares; see src/testing/README.md.
export default {
	title: 'Characterization/FieldGroup/Disabled',
	component: FieldGroup,
	tags: ['g0', '!autodocs'],
	parameters: { layout: 'centered' },
} satisfies Meta<typeof FieldGroup>;

type Story = StoryObj<typeof FieldGroup>;

const fields = (prefix: string) => (
	<>
		<Field>
			<FieldLabel htmlFor={`${prefix}-a`}>A</FieldLabel>
			<FieldRow>
				<TextInput id={`${prefix}-a`} />
			</FieldRow>
		</Field>
		<Field>
			<FieldLabel htmlFor={`${prefix}-b`}>B</FieldLabel>
			<FieldRow>
				<TextInput id={`${prefix}-b`} />
			</FieldRow>
		</Field>
	</>
);

export const AriaTree: Story = {
	render: () => (
		<>
			<FieldGroup aria-label='Enabled'>{fields('enabled')}</FieldGroup>
			<FieldGroup aria-label='Disabled' disabled>
				{fields('disabled')}
			</FieldGroup>
		</>
	),
	play: async ({ canvasElement }) => {
		await expect(ariaSnapshot(canvasElement)).toBe(
			[
				'- group "Enabled":',
				'  - text: "A"',
				'  - textbox "A"',
				'  - text: "B"',
				'  - textbox "B"',
				'- group "Disabled" [disabled]:',
				'  - text: "A"',
				'  - textbox "A" [disabled]',
				'  - text: "B"',
				'  - textbox "B" [disabled]',
			].join('\n'),
		);
	},
};
