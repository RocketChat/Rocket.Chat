import type { Meta, StoryObj } from '@storybook/react';
import { action } from 'storybook/actions';
import { userEvent, within } from 'storybook/test';

import {
	Modal,
	ModalClose,
	ModalContent,
	ModalFooter,
	ModalFooterAnnotation,
	ModalFooterControllers,
	ModalHeader,
	ModalHeaderText,
	ModalHeroImage,
	ModalIcon,
	ModalTagline,
	ModalThumb,
	ModalTitle,
} from '.';
import { Box, type BoxProps } from '../Box';
import { Button } from '../Button';
import { Field, FieldLabel, FieldRow } from '../Field';
import { FieldGroup } from '../FieldGroup';
import { TextInput } from '../TextInput';

export default {
	title: 'Containers/Modal',
	component: Modal,
	subcomponents: {
		ModalClose,
		ModalContent,
		ModalFooter,
		ModalFooterAnnotation,
		ModalFooterControllers,
		ModalHeader,
		ModalHeaderText,
		ModalHeroImage,
		ModalIcon,
		ModalTagline,
		ModalThumb,
		ModalTitle,
	},
	parameters: {
		docs: {
			usage: `
- Use for critical information, a confirmation or decision, input a \`Contextualbar\` can't take, or a workflow that should interrupt the user.
- For low-priority information, use a \`ToastBar\`; for input that shouldn't interrupt the page, prefer a \`Contextualbar\`.
- Keep the header to the \`ModalTitle\` by default. Add a \`ModalIcon\` or \`ModalThumb\` only when a Rocket.Chat app opens the modal or the title strongly needs visual support.
- Never disable the confirm button: let the user submit, then show the errors of the required fields.
- Put the actions in \`ModalFooterControllers\`, usually a \`primary\` \`Button\` to confirm and a \`secondary\` one to cancel. When the action is destructive, make the confirm button \`danger\`.
- Write the \`ModalTitle\` short, in sentence case, and without a question mark.
`,
		},
	},
	argTypes: {
		children: {
			control: false,
			description: 'A `ModalHeader`, a `ModalContent` and a `ModalFooter`.',
			table: { category: 'Content' },
		},
		wrapper: {
			control: false,
			table: { category: 'Composition' },
		},
		wrapperFunction: {
			control: false,
			table: { category: 'Composition' },
		},
	},
} satisfies Meta<typeof Modal>;

type Story = StoryObj<typeof Modal>;

export const Default: Story = {
	render: () => (
		<Modal>
			<ModalHeader>
				<ModalHeaderText>
					<ModalTitle>Modal Header</ModalTitle>
				</ModalHeaderText>
				<ModalClose />
			</ModalHeader>
			<ModalContent>Modal Body</ModalContent>
			<ModalFooter>
				<ModalFooterControllers>
					<Button>Cancel</Button>
					<Button variant='primary' onClick={action('click')}>
						Submit
					</Button>
				</ModalFooterControllers>
			</ModalFooter>
		</Modal>
	),
};

export const _WithThumb: Story = {
	render: () => (
		<Modal>
			<ModalHeader>
				<ModalThumb url='data:image/gif;base64,R0lGODlhAQABAIAAAMLCwgAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==' />
				<ModalHeaderText>
					<ModalTitle>Modal Header</ModalTitle>
				</ModalHeaderText>
				<ModalClose />
			</ModalHeader>
			<ModalContent>Modal Body</ModalContent>
			<ModalFooter>
				<ModalFooterControllers>
					<Button>Cancel</Button>
					<Button variant='primary' onClick={action('click')}>
						Submit
					</Button>
				</ModalFooterControllers>
			</ModalFooter>
		</Modal>
	),
};

export const _WithIcon: Story = {
	render: () => (
		<Modal>
			<ModalHeader>
				<ModalIcon name='info' />
				<ModalHeaderText>
					<ModalTitle>Modal Header</ModalTitle>
				</ModalHeaderText>
				<ModalClose />
			</ModalHeader>
			<ModalContent>Modal Body</ModalContent>
			<ModalFooter>
				<ModalFooterControllers>
					<Button>Cancel</Button>
					<Button variant='primary' onClick={action('click')}>
						Submit
					</Button>
				</ModalFooterControllers>
			</ModalFooter>
		</Modal>
	),
};

export const _WithTagline: Story = {
	render: () => (
		<Modal>
			<ModalHeader>
				<ModalHeaderText>
					<ModalTagline>Tagline</ModalTagline>
					<ModalTitle>Modal Header</ModalTitle>
				</ModalHeaderText>
				<ModalClose />
			</ModalHeader>
			<ModalContent>Modal Body</ModalContent>
			<ModalFooter>
				<ModalFooterControllers>
					<Button>Cancel</Button>
					<Button variant='primary' onClick={action('click')}>
						Submit
					</Button>
				</ModalFooterControllers>
			</ModalFooter>
		</Modal>
	),
};

export const _WithIconAndTagline: Story = {
	render: () => (
		<Modal>
			<ModalHeader>
				<ModalIcon align='end' name='info' />
				<ModalHeaderText>
					<ModalTagline>Tagline</ModalTagline>
					<ModalTitle>Modal Header</ModalTitle>
				</ModalHeaderText>
				<ModalClose />
			</ModalHeader>
			<ModalContent>Modal Body</ModalContent>
			<ModalFooter>
				<ModalFooterControllers>
					<Button>Cancel</Button>
					<Button variant='primary' onClick={action('click')}>
						Submit
					</Button>
				</ModalFooterControllers>
			</ModalFooter>
		</Modal>
	),
};

export const _WithIconVariants: Story = {
	render: () => (
		<Box display='flex' flexDirection='column' gap={16}>
			{(['danger', 'warning', 'info', 'success'] as const).map((variant) => (
				<Modal key={variant}>
					<ModalHeader>
						<ModalIcon variant={variant} name='info' />
						<ModalHeaderText>
							<ModalTitle>Modal Header ({variant})</ModalTitle>
						</ModalHeaderText>
						<ModalClose />
					</ModalHeader>
					<ModalContent>Modal Body</ModalContent>
				</Modal>
			))}
		</Box>
	),
};

export const _WithSubtleTagline: Story = {
	render: () => (
		<Modal>
			<ModalHeader>
				<ModalHeaderText>
					<ModalTagline subtle>Premium capability</ModalTagline>
					<ModalTitle>Modal Header</ModalTitle>
				</ModalHeaderText>
				<ModalClose />
			</ModalHeader>
			<ModalContent>Modal Body</ModalContent>
			<ModalFooter>
				<ModalFooterControllers>
					<Button>Cancel</Button>
					<Button variant='primary' onClick={action('click')}>
						Upgrade
					</Button>
				</ModalFooterControllers>
			</ModalFooter>
		</Modal>
	),
};

export const _WithFixedSize: Story = {
	render: () => (
		<Modal width='x480' height='x360'>
			<ModalHeader>
				<ModalHeaderText>
					<ModalTitle>Modal Header</ModalTitle>
				</ModalHeaderText>
				<ModalClose />
			</ModalHeader>
			<ModalContent>Modal Body</ModalContent>
		</Modal>
	),
};

export const _WithFillContent: Story = {
	render: () => (
		<Modal height='x360'>
			<ModalHeader>
				<ModalHeaderText>
					<ModalTitle>Modal Header</ModalTitle>
				</ModalHeaderText>
				<ModalClose />
			</ModalHeader>
			<ModalContent fill>
				<Box display='flex' flexDirection='column' justifyContent='space-between' height='100%'>
					Content that brings its own footer
					<Box display='flex' justifyContent='end'>
						<Button variant='primary' onClick={action('click')}>
							Next
						</Button>
					</Box>
				</Box>
			</ModalContent>
		</Modal>
	),
};

export const _WithAnnotation: Story = {
	render: () => (
		<Modal>
			<ModalHeader>
				<ModalHeaderText>
					<ModalTitle>Modal Header</ModalTitle>
				</ModalHeaderText>
				<ModalClose />
			</ModalHeader>
			<ModalContent>Modal Body</ModalContent>
			<ModalFooter justify='space-between'>
				<ModalFooterAnnotation>Anototation</ModalFooterAnnotation>
				<ModalFooterControllers>
					<Button>Cancel</Button>
					<Button variant='primary' onClick={action('click')}>
						Submit
					</Button>
				</ModalFooterControllers>
			</ModalFooter>
		</Modal>
	),
};

export const _WithHeroImage: Story = {
	render: () => (
		<Modal>
			<ModalHeader>
				<ModalHeaderText>
					<ModalTitle>Modal Header</ModalTitle>
				</ModalHeaderText>
				<ModalClose />
			</ModalHeader>
			<ModalContent>
				<ModalHeroImage src='data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAoACgDASIAAhEBAxEB/8QAGwAAAgIDAQAAAAAAAAAAAAAAAAcEBgIDBQj/xAAuEAACAQQAAwcEAQUAAAAAAAABAgMABAUREiExBhMUIkFRYQcWcYGhFTJSgpH/xAAYAQADAQEAAAAAAAAAAAAAAAACAwQBAP/EAB4RAAIBBQEBAQAAAAAAAAAAAAABAgMREiExE0HR/9oADAMBAAIRAxEAPwBuXuIkhBuMe5ib/AHQP49q4L3mLitryTLTSpOiHQI5k/HzXa/qbFOEudVTu1dumWvcTaNCZYZ7vU6g6LxqjOU/24dfs1Ouh9FnkMpd3Reeyx83hAxZZEhkdV9/MBrX71WGPvJcqrJBGveKATtuXXqNU0pu02bTHXD/AGvJAluyxxRd6F4x00o+NdKoVrjbzJdvVe1t5cVLc2ck8qjnohgpPtz2v7G6JtPQ2VJwjlcw+37mchpnK6GtIuv5NFWeTsLNPvxWTvpfjvOEfwKKzEVkSct2vscS/BIzSN0YRkeX81UpPqO8masJETu7OOccY4dswYFQeftv096XV5knuJGdm2T1+agvMXj8jEaHX905QihabvcbuS7X566mLWLwSY8PuRnk/u4eZ0deTl71Ef6hY+0yM88TzeNZY4luYwpVYyduOfrvhPTnr0pXSX9y5mCsyJMdyxxvwq599em+taItqCSNc90ChvZRUruUcT0JiO18Elpk7t8v41LWzacxkBSuvjQ/FFJayjDWrCTepAQ2vUH0oo/Jk3ovpwJJeVCP5CN+lFFaaMqy+nAyuChvrTI2kN9JAsi2ZOy4IBHMnkSCP+iqBexSWdxLazoUljJVlPUH2oorkV10pRc7b1zXb/hZOzuJvM86QWEXeELxOzHSIPcmiiiunVlF2RNTpRkrs//Z' />
				Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse non urna posuere, tempor urna nec, lacinia lacus. Vivamus ac
				lobortis arcu. Morbi malesuada, diam sed congue aliquet, dui elit tincidunt leo, a fermentum ante augue nec ex. Vestibulum feugiat
				aliquam sem vel porta. Praesent varius aliquet consequat. Mauris id nisl egestas, egestas ipsum sit amet, vestibulum elit. Cras vel
				dapibus lacus. Sed congue interdum lobortis. In vitae consectetur enim, eu varius leo. Quisque rhoncus nulla a rhoncus lobortis. Sed
				eu nulla libero. Donec lacus ante, vehicula eget eros molestie, ullamcorper tincidunt arcu. Suspendisse eget pulvinar lacus.
			</ModalContent>
			<ModalFooter>
				<ModalFooterControllers>
					<Button>Cancel</Button>
					<Button variant='primary' onClick={action('click')}>
						Submit
					</Button>
				</ModalFooterControllers>
			</ModalFooter>
		</Modal>
	),
};

const FormContainer = (props: BoxProps) => (
	<Box
		{...props}
		is='form'
		onSubmit={(e) => {
			e.preventDefault();
			action('form submitted')(e);
		}}
	/>
);

export const _WithForm: Story = {
	parameters: {
		docs: {
			description: {
				story: "A `form` as the `wrapper`, so the footer's submit button submits the fields in the content.",
			},
		},
	},
	render: () => (
		<Modal wrapper={FormContainer}>
			<ModalHeader>
				<ModalHeaderText>
					<ModalTitle>Modal Header</ModalTitle>
				</ModalHeaderText>
				<ModalClose />
			</ModalHeader>
			<ModalContent>
				<FieldGroup>
					<Field>
						<FieldLabel>Label</FieldLabel>
						<FieldRow>
							<TextInput placeholder='Placeholder' />
						</FieldRow>
					</Field>
				</FieldGroup>
			</ModalContent>
			<ModalFooter>
				<ModalFooterControllers>
					<Button>Cancel</Button>
					<Button type='submit' variant='primary'>
						Submit
					</Button>
				</ModalFooterControllers>
			</ModalFooter>
		</Modal>
	),
};

export const _WithFocusedField: Story = {
	..._WithForm,
	play: async ({ canvasElement }) => {
		await userEvent.click(within(canvasElement.ownerDocument.body).getByPlaceholderText('Placeholder'));
	},
};
