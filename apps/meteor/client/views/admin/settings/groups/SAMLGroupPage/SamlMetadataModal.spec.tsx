import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import SamlMetadataModal from './SamlMetadataModal';

const setup = (overrides: Partial<Parameters<typeof SamlMetadataModal>[0]> = {}) => {
	const props = {
		onClose: jest.fn(),
		onFetch: jest.fn().mockResolvedValue({
			cert: 'CERTDATA',
			entryPoint: 'https://idp.test/sso',
			idpSLORedirectURL: 'https://idp.test/slo',
			warnings: [],
		}),
		onApply: jest.fn(),
		...overrides,
	};
	render(<SamlMetadataModal {...props} />, { wrapper: mockAppRoot().build() });
	return props;
};

it('fetches metadata and shows the preview, then applies edited values', async () => {
	const props = setup();

	await userEvent.type(screen.getByLabelText('SAML_Metadata_url'), 'https://idp.test/metadata.xml');
	await userEvent.click(screen.getByText('SAML_Metadata_fetch'));

	await waitFor(() => expect(props.onFetch).toHaveBeenCalledWith('https://idp.test/metadata.xml'));

	const entryPointInput = await screen.findByLabelText('SAML_Custom_Entry_point');
	expect(entryPointInput).toHaveValue('https://idp.test/sso');
	expect(screen.getByLabelText('SAML_Custom_Cert')).toHaveValue('CERTDATA');
	expect(screen.getByLabelText('SAML_Custom_IDP_SLO_Redirect_URL')).toHaveValue('https://idp.test/slo');

	await userEvent.clear(entryPointInput);
	await userEvent.type(entryPointInput, 'https://idp.test/sso-edited');
	await userEvent.click(screen.getByText('Apply'));

	expect(props.onApply).toHaveBeenCalledWith({
		cert: 'CERTDATA',
		entryPoint: 'https://idp.test/sso-edited',
		idpSLORedirectURL: 'https://idp.test/slo',
	});
});

it('shows a warning callout when the fetch result carries warnings', async () => {
	setup({
		onFetch: jest.fn().mockResolvedValue({ cert: 'CERTDATA', warnings: ['SAML_Metadata_warning_multiple_certs'] }),
	});

	await userEvent.type(screen.getByLabelText('SAML_Metadata_url'), 'https://idp.test/metadata.xml');
	await userEvent.click(screen.getByText('SAML_Metadata_fetch'));

	expect(await screen.findByText('SAML_Metadata_warning_multiple_certs')).toBeInTheDocument();
});

it('returns to Fetch mode when the URL is edited after a successful fetch', async () => {
	setup();

	await userEvent.type(screen.getByLabelText('SAML_Metadata_url'), 'https://idp.test/metadata.xml');
	await userEvent.click(screen.getByText('SAML_Metadata_fetch'));

	expect(await screen.findByText('Apply')).toBeInTheDocument();

	await userEvent.type(screen.getByLabelText('SAML_Metadata_url'), '2');

	expect(await screen.findByText('SAML_Metadata_fetch')).toBeInTheDocument();
	expect(screen.queryByText('Apply')).not.toBeInTheDocument();
});

it('shows the Identifier Format row only when showIdentifierFormat is true', async () => {
	setup({
		showIdentifierFormat: true,
		onFetch: jest.fn().mockResolvedValue({
			cert: 'CERTDATA',
			entryPoint: 'https://idp.test/sso',
			idpSLORedirectURL: 'https://idp.test/slo',
			identifierFormat: 'urn:oasis:names:tc:SAML:2.0:nameid-format:transient',
			warnings: [],
		}),
	});

	await userEvent.type(screen.getByLabelText('SAML_Metadata_url'), 'https://idp.test/metadata.xml');
	await userEvent.click(screen.getByText('SAML_Metadata_fetch'));

	expect(await screen.findByLabelText('SAML_Identifier_Format')).toHaveValue('urn:oasis:names:tc:SAML:2.0:nameid-format:transient');
});

it('does not show the Identifier Format row when showIdentifierFormat is false', async () => {
	setup();

	await userEvent.type(screen.getByLabelText('SAML_Metadata_url'), 'https://idp.test/metadata.xml');
	await userEvent.click(screen.getByText('SAML_Metadata_fetch'));

	expect(await screen.findByLabelText('SAML_Custom_Cert')).toBeInTheDocument();
	expect(screen.queryByLabelText('SAML_Identifier_Format')).not.toBeInTheDocument();
});

it('calls onClose when Cancel is clicked', async () => {
	const props = setup();
	await userEvent.click(screen.getByText('Cancel'));
	expect(props.onClose).toHaveBeenCalled();
});

it('shows a danger callout and allows retry when fetch fails', async () => {
	setup({
		onFetch: jest.fn().mockRejectedValueOnce({ success: false, error: 'SAML_Metadata_fetch_failed' }),
	});

	await userEvent.type(screen.getByLabelText('SAML_Metadata_url'), 'https://idp.test/metadata.xml');
	await userEvent.click(screen.getByText('SAML_Metadata_fetch'));

	expect(await screen.findByText('SAML_Metadata_fetch_failed')).toBeInTheDocument();

	const confirmButton = screen.getByText('SAML_Metadata_fetch');
	expect(confirmButton).toBeInTheDocument();
	expect(confirmButton).not.toBeDisabled();

	const urlInput = screen.getByLabelText('SAML_Metadata_url') as HTMLInputElement;
	expect(urlInput.value).toBe('https://idp.test/metadata.xml');
});
