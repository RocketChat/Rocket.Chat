import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import TemplateSelect from './TemplateSelect';
import { createFakeOutboundTemplate } from '../../../../../../tests/mocks/data/outbound-message';

const component = {
	header: { type: 'header', text: 'New {{1}} appointment' },
	body: { type: 'body', text: 'Hello {{1}}' },
} as const;

const template1 = createFakeOutboundTemplate({
	id: 'template-1',
	name: 'Template One',
	language: 'en_US',
	components: [component.body],
});

export const template2 = createFakeOutboundTemplate({
	id: 'template-2',
	name: 'Template Two',
	language: 'pt_BR',
	components: [component.header, component.body],
});

const mockTemplates = [template1, template2];

const appRoot = mockAppRoot().build();

describe('TemplateSelect', () => {
	it('should render correctly', () => {
		render(<TemplateSelect templates={mockTemplates} placeholder='Select template' value='' onChange={jest.fn()} />, { wrapper: appRoot });
		expect(screen.getByPlaceholderText('Select template')).toBeInTheDocument();
	});

	it('should display the correct template options with language descriptions', async () => {
		render(<TemplateSelect templates={mockTemplates} placeholder='Select template' value='' onChange={jest.fn()} />, { wrapper: appRoot });

		await userEvent.click(screen.getByPlaceholderText('Select template'));

		const optionOne = await screen.findByRole('option', { name: /Template One/ });
		const optionTwo = await screen.findByRole('option', { name: /Template Two/ });

		expect(optionOne).toBeInTheDocument();
		expect(optionTwo).toBeInTheDocument();
	});

	it('should display the template language as the option description', async () => {
		render(<TemplateSelect templates={mockTemplates} placeholder='Select template' value='' onChange={jest.fn()} />, { wrapper: appRoot });

		await userEvent.click(screen.getByPlaceholderText('Select template'));

		const optionOne = await screen.findByRole('option', { name: /Template One/ });
		const optionTwo = await screen.findByRole('option', { name: /Template Two/ });

		expect(optionOne).toHaveTextContent('English');
		expect(optionTwo).toHaveTextContent('português (Brasil)');
	});
});
