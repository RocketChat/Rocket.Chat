import type { BehaviorWithContext } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ManageLicenseModal from './ManageLicenseModal';
import createDeferredMockFn from '../../../../../../../../tests/mocks/utils/createDeferredMockFn';

// Long enough to pass isPlausibleLicense (>= 100 chars) so validation actually runs.
const LICENSE = 'a'.repeat(120);
const OTHER_LICENSE = 'b'.repeat(120);

const reasons = (...pairs: [string, string][]): BehaviorWithContext[] =>
	pairs.map(([behavior, reason]) => ({ behavior, reason }) as BehaviorWithContext);

// The endpoint is typed `void`; the REST client resolves it as `null`, so mocks must return null.
const validationSuccess = () => null;
const validationFailure = (fails: BehaviorWithContext[]) => () => Promise.reject({ reasons: fails });

// getByLabelText matches by label association regardless of visibility, so it reaches the display:none input.
const fileInput = () => screen.getByLabelText('Upload_license_file');

it('should render the title, description and a disabled apply button', () => {
	render(<ManageLicenseModal enterpriseLicense='' onCancel={jest.fn()} />, { wrapper: mockAppRoot().build() });

	expect(screen.getByRole('heading', { name: 'Manage_license' })).toBeInTheDocument();
	expect(screen.getByText('Manage_license_description')).toBeInTheDocument();
	expect(screen.getByRole('button', { name: 'Apply_license' })).toBeDisabled();
});

it('should show a success status for a valid license', async () => {
	render(<ManageLicenseModal enterpriseLicense={LICENSE} onCancel={jest.fn()} />, {
		wrapper: mockAppRoot().withEndpoint('POST', '/v1/licenses.validate', validationSuccess).build(),
	});

	expect(await screen.findByText('Valid_license')).toBeInTheDocument();
});

it('should map a validation failure to a specific message', async () => {
	render(<ManageLicenseModal enterpriseLicense={LICENSE} onCancel={jest.fn()} />, {
		wrapper: mockAppRoot()
			.withEndpoint('POST', '/v1/licenses.validate', validationFailure(reasons(['invalidate_license', 'period'])))
			.build(),
	});

	expect(await screen.findByText('License_error_expired')).toBeInTheDocument();
	expect(screen.getByText('Invalid_license')).toBeInTheDocument();
});

it('should show a generic message when validation fails for a non-license reason', async () => {
	render(<ManageLicenseModal enterpriseLicense={LICENSE} onCancel={jest.fn()} />, {
		wrapper: mockAppRoot()
			.withEndpoint('POST', '/v1/licenses.validate', () => Promise.reject(new Error('network down')))
			.build(),
	});

	expect(await screen.findByText('License_error_generic')).toBeInTheDocument();
});

it('should show a validating status while the request is in flight', async () => {
	const { fn, resolve } = createDeferredMockFn<null>();

	render(<ManageLicenseModal enterpriseLicense={LICENSE} onCancel={jest.fn()} />, {
		wrapper: mockAppRoot().withEndpoint('POST', '/v1/licenses.validate', fn).build(),
	});

	expect(await screen.findByText('Validating_license...')).toBeInTheDocument();

	act(() => resolve(null));

	expect(await screen.findByText('Valid_license')).toBeInTheDocument();
});

it('should populate the preview and validate an uploaded .txt file', async () => {
	render(<ManageLicenseModal enterpriseLicense='' onCancel={jest.fn()} />, {
		wrapper: mockAppRoot().withEndpoint('POST', '/v1/licenses.validate', validationSuccess).build(),
	});

	await userEvent.upload(fileInput(), new File([LICENSE], 'license.txt', { type: 'text/plain' }));

	expect(await screen.findByText('license.txt')).toBeInTheDocument();
	expect(await screen.findByText('Valid_license')).toBeInTheDocument();
});

it('should reject an uploaded non-txt file with an error status', async () => {
	render(<ManageLicenseModal enterpriseLicense='' onCancel={jest.fn()} />, {
		wrapper: mockAppRoot().build(),
	});

	// Bypass the input's `accept` filter so the guard in handleFile is what rejects the file.
	const user = userEvent.setup({ applyAccept: false });
	await user.upload(fileInput(), new File(['nope'], 'license.png', { type: 'image/png' }));

	expect(await screen.findByText('Only_txt_license_files_are_supported')).toBeInTheDocument();
});

it('should apply a valid license and close the modal', async () => {
	const onCancel = jest.fn();

	render(<ManageLicenseModal enterpriseLicense='' onCancel={onCancel} />, {
		wrapper: mockAppRoot().withEndpoint('POST', '/v1/licenses.validate', validationSuccess).build(),
	});

	await userEvent.upload(fileInput(), new File([OTHER_LICENSE], 'license.txt', { type: 'text/plain' }));

	const applyButton = screen.getByRole('button', { name: 'Apply_license' });
	await waitFor(() => expect(applyButton).toBeEnabled());

	await userEvent.click(applyButton);

	await waitFor(() => expect(onCancel).toHaveBeenCalled());
});

it('should ask for confirmation before removing the current license', async () => {
	render(<ManageLicenseModal enterpriseLicense={LICENSE} onCancel={jest.fn()} />, {
		wrapper: mockAppRoot().withEndpoint('POST', '/v1/licenses.validate', validationSuccess).build(),
	});

	// The remove action only shows when the entered license is the applied one.
	await userEvent.click(await screen.findByRole('button', { name: 'Remove_license' }));

	expect(screen.getByRole('heading', { name: 'Remove_license_key' })).toBeInTheDocument();
});
