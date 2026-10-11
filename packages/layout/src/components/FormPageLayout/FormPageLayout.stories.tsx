import type { Meta, StoryFn } from '@storybook/react-webpack5';

import Form from './Form';
import FormContainer from './FormContainer';
import FormFooter from './FormFooter';
import FormHeader from './FormHeader';
import FormSteps from './FormSteps';
import FormSubtitle from './FormSubtitle';
import FormTitle from './FormTitle';

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
