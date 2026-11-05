import type { Meta, StoryFn } from '@storybook/react-webpack5';

import Form from './Form.js';
import FormContainer from './FormContainer.js';
import FormFooter from './FormFooter.js';
import FormHeader from './FormHeader.js';
import FormSteps from './FormSteps.js';
import FormSubtitle from './FormSubtitle.js';
import FormTitle from './FormTitle.js';

export default {
	title: 'components/FormPageLayout',
	component: Form,
	parameters: {
		layout: 'centered',
	},
	decorators: [
		(Story) => (
			<div style={{ width: '600px' }}>
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof Form>;

export const Default: StoryFn<typeof Form> = () => (
	<Form>
		<FormHeader>
			<FormSteps currentStep={1} stepCount={2} />
			<FormTitle>Title</FormTitle>
			<FormSubtitle>Subtitle</FormSubtitle>
		</FormHeader>
		<FormContainer>Container</FormContainer>
		<FormFooter>footer</FormFooter>
	</Form>
);
