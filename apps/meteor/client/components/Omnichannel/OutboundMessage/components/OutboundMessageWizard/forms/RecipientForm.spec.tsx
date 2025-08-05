import { mockAppRoot } from '@rocket.chat/mock-providers';
import { screen, render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';

import RecipientForm from './RecipientForm';
import { createFakeContactChannel, createFakeContactWithManagerData } from '../../../../../../../tests/mocks/data';
import { createFakeOutboundTemplate, createFakeProviderMetadata } from '../../../../../../../tests/mocks/data/outbound-message';

// NOTE: Mocking tinykeys to avoid conflicts with esm/cjs imports in Jest
// Can be safely removed once cause is found and fixed
jest.mock('tinykeys', () => ({
	__esModule: true,
	default: jest.fn().mockReturnValue(() => () => undefined),
}));

const recipientPhoneNumber = '+12125554567';
const senderPhoneNumber = '+12127774567';

const contactMock = createFakeContactWithManagerData({
	_id: 'contact-1',
	name: 'Contact 1',
	phones: [{ phoneNumber: recipientPhoneNumber }],
	channels: [
		createFakeContactChannel({
			name: 'provider-1',
			lastChat: { _id: '', ts: new Date().toISOString() },
		}),
	],
});

const getContactMock = jest.fn().mockImplementation(() => ({ contact: contactMock }));
const getContactMocksMock = jest.fn().mockImplementation(() => ({
	contacts: [contactMock],
	count: 1,
	offset: 0,
	total: 1,
	success: true,
}));

const providerMock = createFakeProviderMetadata({
	providerId: 'provider-1',
	providerName: 'Provider 1',
	templates: {
		[senderPhoneNumber]: [createFakeOutboundTemplate({ phoneNumber: senderPhoneNumber })],
	},
});
const getProvidersMock = jest.fn().mockImplementation(() => ({ providers: [providerMock] }));
const getProviderMock = jest.fn().mockImplementation(() => ({ metadata: providerMock }));

const appRoot = mockAppRoot()
	.withJohnDoe()
	.withEndpoint('GET', '/v1/omnichannel/contacts.get', () => getContactMock())
	.withEndpoint('GET', '/v1/omnichannel/contacts.search', () => getContactMocksMock())
	.withEndpoint('GET', '/v1/omnichannel/outbound/providers', () => getProvidersMock())
	.withEndpoint('GET', '/v1/omnichannel/outbound/providers/:id/metadata', () => getProviderMock())
	.withTranslations('en', 'core', {
		Error_loading__name__information: 'Error loading {{name}} information',
		Last_contact__time__: 'Last contact {{time, relativeTime}}',
		No_phone_number_yet_edit_contact: 'No phone number yet <1>Edit contact</1>',
		No_phone_number_available_for_selected_channel: 'No phone number available for the selected channel',
		Submit: 'Submit',
	});

describe('RecipientForm', () => {
	const defaultProps = {
		onDirty: jest.fn(),
		onSubmit: jest.fn(),
	};

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('renders correctly with all required fields', async () => {
		render(<RecipientForm {...defaultProps} />, { wrapper: appRoot.build() });

		expect(screen.getByLabelText('Contact*')).toBeInTheDocument();
		expect(screen.getByLabelText('Channel*')).toBeInTheDocument();
		expect(screen.getByLabelText('To*')).toBeInTheDocument();
		expect(screen.getByLabelText('From*')).toBeInTheDocument();

		expect(screen.getByLabelText('Contact*')).not.toHaveAttribute('aria-disabled');
		expect(screen.getByLabelText('Channel*')).toHaveAttribute('aria-disabled', 'true');
		expect(screen.getByLabelText('To*')).toHaveClass('disabled');
		expect(screen.getByLabelText('From*')).toHaveClass('disabled');
	});

	it('should pass accessibility tests', async () => {
		const { container } = render(<RecipientForm {...defaultProps} />, { wrapper: appRoot.build() });
		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});

	it('should render with default values', async () => {
		const defaultValues = {
			contactId: 'contact-1',
			providerId: 'provider-1',
			recipient: recipientPhoneNumber,
			sender: senderPhoneNumber,
		};

		render(<RecipientForm defaultValues={defaultValues} {...defaultProps} />, { wrapper: appRoot.build() });

		await waitFor(() => expect(screen.getByLabelText('Contact*')).toHaveTextContent('Contact 1'));
		await waitFor(() => expect(screen.getByLabelText('Channel*')).toHaveTextContent('Provider 1'));
		expect(screen.getByLabelText('To*')).toHaveTextContent(/\+1 212-555-4567/);
		expect(screen.getByLabelText('From*')).toHaveTextContent(/\+1 212-777-4567/);
	});

	it('should disable provider selection when no contact is selected', async () => {
		render(<RecipientForm {...defaultProps} />, { wrapper: appRoot.build() });

		expect(screen.getByLabelText('Contact*')).not.toHaveAttribute('aria-disabled');
		expect(screen.getByLabelText('Channel*')).toHaveAttribute('aria-disabled', 'true');
	});

	it('should disable recipient selection when no provider is selected', async () => {
		const defaultValues = { contactId: 'contact-1' };
		render(<RecipientForm {...defaultProps} defaultValues={defaultValues} />, { wrapper: appRoot.build() });

		expect(screen.getByLabelText('Channel*')).toHaveAttribute('aria-disabled', 'false');
		expect(screen.getByLabelText('To*')).toHaveClass('disabled');
	});

	it('should disable sender selection when no recipient is selected', async () => {
		const defaultValues = { contactId: 'contact-1', providerId: 'provider-1' };

		render(<RecipientForm {...defaultProps} defaultValues={defaultValues} />, { wrapper: appRoot.build() });

		expect(screen.getByLabelText('To*')).not.toHaveClass('disabled');
		expect(screen.getByLabelText('From*')).toHaveClass('disabled');
	});

	it('should enable sender selection when recipient is selected', async () => {
		const defaultValues = {
			contactId: 'contact-1',
			providerId: 'provider-1',
			recipient: recipientPhoneNumber,
		};

		render(<RecipientForm {...defaultProps} defaultValues={defaultValues} />, { wrapper: appRoot.build() });

		expect(screen.getByLabelText('From*')).not.toHaveClass('disabled');
	});

	it('should show retry button when contact fetch fails', async () => {
		getContactMock.mockImplementationOnce(() => Promise.reject());

		render(<RecipientForm defaultValues={{ contactId: 'contact-1' }} {...defaultProps} />, { wrapper: appRoot.build() });

		const contactErrorMessage = await screen.findByText('Error loading contact information');
		expect(contactErrorMessage).toBeInTheDocument();

		const retryButton = screen.getByRole('button', { name: 'Retry' });
		expect(retryButton).toBeInTheDocument();
	});

	it('should show retry button when provider fetch fails', async () => {
		getProviderMock.mockImplementationOnce(() => Promise.reject());

		render(<RecipientForm defaultValues={{ contactId: 'contact-1', providerId: 'provider-1' }} {...defaultProps} />, {
			wrapper: appRoot.build(),
		});

		const channelErrorMessage = await screen.findByText('Error loading channel information');
		expect(channelErrorMessage).toBeInTheDocument();

		const retryButton = screen.getByRole('button', { name: 'Retry' });
		expect(retryButton).toBeInTheDocument();
	});

	it('should call retry contact fetch when retry button is clicked', async () => {
		getContactMock.mockImplementationOnce(() => Promise.reject());

		render(<RecipientForm defaultValues={{ contactId: 'contact-1' }} {...defaultProps} />, {
			wrapper: appRoot.build(),
		});

		expect(await screen.findByText('Error loading contact information')).toBeInTheDocument();

		const retryButton = screen.getByRole('button', { name: 'Retry' });
		await userEvent.click(retryButton);

		await waitFor(() => expect(screen.queryByText('Error loading contact information')).not.toBeInTheDocument());
	});

	it('should call retry channel fetch when retry button is clicked', async () => {
		getProviderMock.mockImplementationOnce(() => Promise.reject());

		render(<RecipientForm defaultValues={{ contactId: 'contact-1', providerId: 'provider-1' }} {...defaultProps} />, {
			wrapper: appRoot.build(),
		});

		expect(await screen.findByText('Error loading channel information')).toBeInTheDocument();

		const retryButton = screen.getByRole('button', { name: 'Retry' });
		await userEvent.click(retryButton);

		await waitFor(() => expect(screen.queryByText('Error loading channel information')).not.toBeInTheDocument());
	});

	it('should display channel hint when provider has lastChat', async () => {
		render(<RecipientForm defaultValues={{ contactId: 'contact-1', providerId: 'provider-1' }} {...defaultProps} />, {
			wrapper: appRoot.build(),
		});

		const hintText = await screen.findByText(/Last contact/);
		expect(hintText).toBeInTheDocument();
	});

	it('should call onSubmit with correct values when form is submitted', async () => {
		const handleSubmit = jest.fn();
		const defaultValues = {
			contactId: 'contact-1',
			providerId: 'provider-1',
			recipient: recipientPhoneNumber,
			sender: senderPhoneNumber,
		};

		render(<RecipientForm {...defaultProps} defaultValues={defaultValues} onSubmit={handleSubmit} />, {
			wrapper: appRoot.build(),
		});

		await userEvent.click(screen.getByRole('button', { name: 'Submit' }));

		await waitFor(() =>
			expect(handleSubmit).toHaveBeenCalledWith({
				contactId: 'contact-1',
				providerId: 'provider-1',
				recipient: recipientPhoneNumber,
				sender: senderPhoneNumber,
				contact: contactMock,
				provider: providerMock,
			}),
		);
	});

	it('should display no phone number error when contact has no phones', async () => {
		const handleSubmit = jest.fn();
		getContactMock.mockImplementationOnce(() => ({
			contact: createFakeContactWithManagerData({ ...contactMock, phones: undefined }),
		}));

		const defaultValues = {
			contactId: 'contact-1',
			providerId: 'provider-1',
		};

		render(<RecipientForm {...defaultProps} defaultValues={defaultValues} onSubmit={handleSubmit} />, {
			wrapper: appRoot.build(),
		});

		await userEvent.click(screen.getByRole('button', { name: 'Submit' }));

		const errorMessage = await screen.findByText(/No phone number yet/);
		expect(errorMessage).toBeInTheDocument();

		const editLink = screen.getByText(/edit contact/i);
		expect(editLink).toBeInTheDocument();
	});

	it('should call onDirty when form becomes dirty', async () => {
		const mockOnDirty = jest.fn();
		const defaultValues = {
			contactId: 'contact-1',
			providerId: 'provider-1',
			recipient: recipientPhoneNumber,
		};

		render(<RecipientForm {...defaultProps} defaultValues={defaultValues} onDirty={mockOnDirty} />, {
			wrapper: appRoot.build(),
		});

		await userEvent.click(screen.getByLabelText('From*'));

		const phoneOption = await screen.findByRole('option', { name: '+1 212-777-4567' });
		expect(phoneOption).toBeInTheDocument();

		await userEvent.click(phoneOption);

		expect(mockOnDirty).toHaveBeenCalledTimes(1);
	});

	it('should show correct error when no phone numbers available for selected channel', async () => {
		const handleSubmit = jest.fn();
		getProviderMock.mockImplementationOnce(() => ({
			metadata: createFakeProviderMetadata({ ...providerMock, templates: {} }),
		}));

		const defaultValues = {
			contactId: 'contact-1',
			providerId: 'provider-1',
			recipient: recipientPhoneNumber,
		};

		render(<RecipientForm {...defaultProps} defaultValues={defaultValues} onSubmit={handleSubmit} />, {
			wrapper: appRoot.build(),
		});

		await userEvent.click(screen.getByRole('button', { name: 'Submit' }));

		const errorMessage = await screen.findByText('No phone number available for the selected channel');
		expect(errorMessage).toBeInTheDocument();
	});

	// TODO: it('should validate sender field when provider changes');
});
