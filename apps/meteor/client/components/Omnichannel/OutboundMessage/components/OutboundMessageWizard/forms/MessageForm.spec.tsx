import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';

import MessageForm from './MessageForm';
import { createFakeContactWithManagerData } from '../../../../../../../tests/mocks/data';
import { createFakeOutboundTemplate } from '../../../../../../../tests/mocks/data/outbound-message';

jest.mock('tinykeys', () => ({
	__esModule: true,
	default: jest.fn().mockReturnValue(() => () => undefined),
}));

const component = {
	header: { type: 'HEADER', text: 'New {{1}} appointment' },
	body: { type: 'BODY', text: 'Hello {{1}}' },
} as const;

const template1 = createFakeOutboundTemplate({
	id: 'template-1',
	name: 'Template One',
	components: [component.body],
});

export const template2 = createFakeOutboundTemplate({
	id: 'template-2',
	name: 'Template Two',
	components: [component.header, component.body],
});

const mockTemplates = [template1, template2];
const mockContact = createFakeContactWithManagerData({ _id: 'contact-1', name: 'John Doe' });

const appRoot = mockAppRoot().withTranslations('en', 'core', {
	Template: 'Template',
	template: 'template',
	Select_template: 'Select template',
	Required_field: '{{field}} is required',
	Template_message: 'Template message',
	No_templates_available: 'No templates available',
	Error_loading__name__information: 'Error loading {{name}} information',
	Submit: 'Submit',
});

describe('MessageForm', () => {
	const defaultProps = {
		templates: mockTemplates,
		contact: mockContact,
		onSubmit: jest.fn(),
	};

	beforeEach(() => {
		jest.clearAllMocks();
	});

	// TODO: adjust accessibility tests to integrate with storybook
	xit('should pass accessibility tests', async () => {
		const { container } = render(<MessageForm {...defaultProps} />, { wrapper: appRoot.build() });
		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});

	it('should render correctly', async () => {
		render(<MessageForm {...defaultProps} />, { wrapper: appRoot.build() });

		expect(screen.getByLabelText('Template*')).toBeInTheDocument();
	});

	it('should render with default values', async () => {
		const defaultValues = { templateId: 'template-1' };
		render(<MessageForm {...defaultProps} defaultValues={defaultValues} />, { wrapper: appRoot.build() });

		expect(screen.getByLabelText('Template*')).toHaveTextContent('Template One');
	});

	it('should show TemplateEditor when a template is selected', async () => {
		render(<MessageForm {...defaultProps} />, { wrapper: appRoot.build() });

		expect(screen.queryByText(component.body.text)).not.toBeInTheDocument();

		await userEvent.click(screen.getByLabelText('Template*'));
		await userEvent.click(await screen.findByRole('option', { name: 'Template One' }));

		expect(screen.getByLabelText('Template*')).toHaveTextContent('Template One');
		expect(await screen.findByText(component.body.text)).toBeInTheDocument();
	});

	it('should call onSubmit with correct data on successful submission', async () => {
		const handleSubmit = jest.fn();
		render(<MessageForm {...defaultProps} onSubmit={handleSubmit} />, { wrapper: appRoot.build() });

		await userEvent.click(screen.getByLabelText('Template*'));
		await userEvent.click(await screen.findByRole('option', { name: 'Template One' }));

		await userEvent.click(screen.getByRole('button', { name: 'Submit' }));

		await waitFor(() => {
			expect(handleSubmit).toHaveBeenCalledWith(
				expect.objectContaining({
					templateId: 'template-1',
					template: template1,
					templateParameters: {},
				}),
			);
		});
	});

	it('should show required error when submitting without a template', async () => {
		const handleSubmit = jest.fn();
		render(<MessageForm {...defaultProps} onSubmit={handleSubmit} />, { wrapper: appRoot.build() });

		await userEvent.click(screen.getByRole('button', { name: 'Submit' }));

		expect(await screen.findByText('Template message is required')).toBeInTheDocument();
		expect(handleSubmit).not.toHaveBeenCalled();
	});

	it('should show "no templates available" error if templates array is empty', async () => {
		const handleSubmit = jest.fn();
		render(<MessageForm {...defaultProps} templates={[]} onSubmit={handleSubmit} />, { wrapper: appRoot.build() });

		await userEvent.click(screen.getByRole('button', { name: 'Submit' }));

		expect(await screen.findByText('No templates available')).toBeInTheDocument();
		expect(handleSubmit).not.toHaveBeenCalled();
	});

	it('should throw an error if the selected template is not found on submit', async () => {
		const handleSubmit = jest.fn();
		const defaultValues = { templateId: 'template-1' };
		render(<MessageForm {...defaultProps} templates={[template2]} defaultValues={defaultValues} onSubmit={handleSubmit} />, {
			wrapper: appRoot.build(),
		});

		await userEvent.click(screen.getByRole('button', { name: 'Submit' }));

		expect(await screen.findByText('Error loading template information')).toBeInTheDocument();
		expect(handleSubmit).not.toHaveBeenCalled();
	});

	it('should render custom actions via renderActions prop', async () => {
		const renderActions = jest.fn(({ isSubmitting }) => <button disabled={isSubmitting}>Custom Action</button>);
		render(<MessageForm {...defaultProps} renderActions={renderActions} />, { wrapper: appRoot.build() });

		expect(screen.getByRole('button', { name: 'Custom Action' })).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Submit' })).not.toBeInTheDocument();
		expect(renderActions).toHaveBeenCalledWith({ isSubmitting: false });
	});
});
