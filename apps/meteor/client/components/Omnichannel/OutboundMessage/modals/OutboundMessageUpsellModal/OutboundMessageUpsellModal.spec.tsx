import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import OutboundMessageUpsellModal from './OutboundMessageUpsellModal';

const openExternalLink = jest.fn();
jest.mock('../../../../../hooks/useExternalLink', () => ({
	useExternalLink: jest.fn(() => openExternalLink),
}));

jest.mock('../../../../../../app/utils/client', () => ({
	getURL: (url: string) => url,
}));

const appRoot = mockAppRoot().withJohnDoe().withTranslations('en', 'core', {
	Learn_more: 'Learn more',
	Contact_sales: 'Contact sales',
	Outbound_message_upsell_annotation: 'Outbound_message_upsell_annotation',
	No_phone_number_available_for_selected_channel: 'No phone number available for the selected channel',
});
describe('OutboundMessageUpsellModal', () => {
	const onClose = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('hasModule is false', () => {
		it('should render "Learn more" and "Contact sales" buttons', () => {
			render(<OutboundMessageUpsellModal onClose={onClose} />, { wrapper: appRoot.build() });
			expect(screen.getByRole('button', { name: 'Learn more' })).toBeInTheDocument();
			expect(screen.getByRole('button', { name: 'Contact sales' })).toBeInTheDocument();
		});

		it('should call openExternalLink with docs link when "Learn more" is clicked', async () => {
			render(<OutboundMessageUpsellModal onClose={onClose} />, { wrapper: appRoot.build() });
			await userEvent.click(screen.getByRole('button', { name: 'Learn more' }));
			expect(openExternalLink).toHaveBeenCalledWith('https://go.rocket.chat/i/omnichannel-docs');
		});

		it('should call openExternalLink with sales link when "Contact sales" is clicked', async () => {
			render(<OutboundMessageUpsellModal onClose={onClose} />, { wrapper: appRoot.build() });
			await userEvent.click(screen.getByRole('button', { name: 'Contact sales' }));
			expect(openExternalLink).toHaveBeenCalledWith('https://go.rocket.chat/i/contact-sales');
		});

		it('should not render the annotation', () => {
			render(<OutboundMessageUpsellModal onClose={onClose} />, { wrapper: appRoot.build() });
			expect(screen.queryByText('Outbound_message_upsell_annotation')).not.toBeInTheDocument();
		});
	});

	describe('hasModule is true', () => {
		describe('user is not admin', () => {
			it('should render only "Learn more" button', () => {
				render(<OutboundMessageUpsellModal hasModule onClose={onClose} />, { wrapper: appRoot.build() });
				expect(screen.getByRole('button', { name: 'Learn more' })).toBeInTheDocument();
				expect(screen.queryByRole('button', { name: 'Contact sales' })).not.toBeInTheDocument();
			});

			it('should render the annotation', () => {
				render(<OutboundMessageUpsellModal hasModule onClose={onClose} />, { wrapper: appRoot.build() });
				expect(screen.getByText('Outbound_message_upsell_annotation')).toBeInTheDocument();
			});

			it('should call openExternalLink with docs link when "Learn more" is clicked', async () => {
				render(<OutboundMessageUpsellModal hasModule onClose={onClose} />, { wrapper: appRoot.build() });
				await userEvent.click(screen.getByRole('button', { name: 'Learn more' }));
				expect(openExternalLink).toHaveBeenCalledWith('https://go.rocket.chat/i/omnichannel-docs');
			});
		});

		describe('user is admin', () => {
			it('should render only "Learn more" button', () => {
				render(<OutboundMessageUpsellModal hasModule isAdmin onClose={onClose} />, { wrapper: appRoot.build() });
				expect(screen.getByRole('button', { name: 'Learn more' })).toBeInTheDocument();
				expect(screen.queryByRole('button', { name: 'Contact sales' })).not.toBeInTheDocument();
			});

			it('should not render the annotation', () => {
				render(<OutboundMessageUpsellModal hasModule isAdmin onClose={onClose} />, { wrapper: appRoot.build() });
				expect(screen.queryByText('Outbound_message_upsell_annotation')).not.toBeInTheDocument();
			});
		});
	});
});
