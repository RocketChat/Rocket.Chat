import type { Meta, StoryObj } from '@storybook/react-vite';
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
			description: {
				component:
					"A powerful component that temporarily blocks interaction with the main view to capture and hold the user's undivided attention with a distinct prompt or information window.\n\n" +
					'**Rules**\n' +
					"- Use for critical information, gathering input when a contextual bar isn't applicable, confirmations/decisions, or interruptive workflows.\n" +
					'- For low-priority information use a Toast instead; for non-disruptive contextual input prefer the Contextual bar.\n' +
					'- Title must use sentence case and contain no question mark; keep titles concise.\n' +
					'- Default the header to title only — hide any icon/thumbnail unless the modal is triggered by a Rocket.Chat app or the title strongly needs visual reinforcement.\n' +
					'- Never disable the confirmation (Primary) button — allow submit, then show required-field errors after the user clicks confirm.\n' +
					'- Footer actions use the Button component — typically one Primary (confirm) + one Secondary (cancel); for destructive confirmations the Primary becomes a danger button.',
			},
		},
	},
	argTypes: {
		children: {
			control: false,
			description: 'Modal sections (header, content, footer) rendered inside the dialog wrapper.',
			table: { category: 'Content' },
		},
		wrapper: {
			control: false,
			description:
				'Component type used to wrap `children` inside the dialog; defaults to `Box`. Receives `elevation`, `className` and `children`.',
			table: { category: 'Composition' },
		},
		wrapperFunction: {
			control: false,
			description: 'Function alternative to `wrapper` for rendering the inner wrapper; takes precedence over `wrapper` when provided.',
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
