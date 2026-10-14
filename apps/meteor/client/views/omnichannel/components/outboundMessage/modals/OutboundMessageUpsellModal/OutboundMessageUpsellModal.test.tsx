import { beforeEach, describe, it } from 'node:test';

import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'expect';
import { ModuleMocker } from 'jest-mock';
import type { FunctionLike } from 'jest-mock';
import proxyquire from 'proxyquire';

import { CONTACT_SALES_LINK, OUTBOUND_DOCS_LINK } from '../../constants';

const mocker = new ModuleMocker(globalThis);
const fn: ModuleMocker['fn'] = mocker.fn.bind(mocker);

const openExternalLink = fn<FunctionLike>();

const appRoot = mockAppRoot().withJohnDoe().withTranslations('en', 'core', {
	Learn_more: 'Learn more',
	Contact_sales: 'Contact sales',
	Outbound_message_upsell_annotation: 'Outbound_message_upsell_annotation',
	No_phone_number_available_for_selected_channel: 'No phone number available for the selected channel',
});

const { default: OutboundMessageUpsellModal } = proxyquire
	.noCallThru()
	.load<typeof import('./OutboundMessageUpsellModal')>('./OutboundMessageUpsellModal', {
		'../../../../../../hooks/useExternalLink': {
			useExternalLink: fn<FunctionLike>(() => openExternalLink),
		},
		'../../../../../../lib/getURL': {
			getURL: (url: string) => url,
		},
	});

describe('OutboundMessageUpsellModal', () => {
	const onClose = fn<FunctionLike>();

	beforeEach(() => {
		mocker.clearAllMocks();
	});

	describe('hasModule is false', () => {
		describe('user is not admin', () => {
			it('should render only "Learn more" button', () => {
				render(<OutboundMessageUpsellModal onClose={onClose} />, { wrapper: appRoot.build() });
				expect(screen.getByRole('button', { name: 'Learn more' })).toBeInTheDocument();
				expect(screen.queryByRole('button', { name: 'Contact sales' })).not.toBeInTheDocument();
			});

			it('should render the annotation', () => {
				render(<OutboundMessageUpsellModal onClose={onClose} />, { wrapper: appRoot.build() });
				expect(screen.getByText('Outbound_message_upsell_annotation')).toBeInTheDocument();
			});

			it('should call openExternalLink with docs link when "Learn more" is clicked', async () => {
				render(<OutboundMessageUpsellModal onClose={onClose} />, { wrapper: appRoot.build() });
				await userEvent.click(screen.getByRole('button', { name: 'Learn more' }));
				expect(openExternalLink).toHaveBeenCalledWith(OUTBOUND_DOCS_LINK);
			});
		});

		describe('user is admin', () => {
			it('should render "Learn more" and "Contact sales" buttons', () => {
				render(<OutboundMessageUpsellModal isAdmin onClose={onClose} />, { wrapper: appRoot.build() });
				expect(screen.getByRole('button', { name: 'Learn more' })).toBeInTheDocument();
				expect(screen.getByRole('button', { name: 'Contact sales' })).toBeInTheDocument();
			});

			it('should render "Upgrade" button when isCommunity is true', () => {
				render(<OutboundMessageUpsellModal isAdmin isCommunity onClose={onClose} />, { wrapper: appRoot.build() });
				expect(screen.getByRole('button', { name: 'Upgrade' })).toBeInTheDocument();
				expect(screen.queryByRole('button', { name: 'Contact sales' })).not.toBeInTheDocument();
			});

			it('should call openExternalLink with docs link when "Learn more" is clicked', async () => {
				render(<OutboundMessageUpsellModal isAdmin onClose={onClose} />, { wrapper: appRoot.build() });
				await userEvent.click(screen.getByRole('button', { name: 'Learn more' }));
				expect(openExternalLink).toHaveBeenCalledWith(OUTBOUND_DOCS_LINK);
			});

			it('should call openExternalLink with sales link when "Contact sales" is clicked', async () => {
				render(<OutboundMessageUpsellModal isAdmin onClose={onClose} />, { wrapper: appRoot.build() });
				await userEvent.click(screen.getByRole('button', { name: 'Contact sales' }));
				expect(openExternalLink).toHaveBeenCalledWith(CONTACT_SALES_LINK);
			});

			it('should not render the annotation', () => {
				render(<OutboundMessageUpsellModal isAdmin onClose={onClose} />, { wrapper: appRoot.build() });
				expect(screen.queryByText('Outbound_message_upsell_annotation')).not.toBeInTheDocument();
			});
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
				expect(openExternalLink).toHaveBeenCalledWith(OUTBOUND_DOCS_LINK);
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
