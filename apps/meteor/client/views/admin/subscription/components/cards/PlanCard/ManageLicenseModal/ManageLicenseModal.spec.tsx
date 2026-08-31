import type { BehaviorWithContext } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { composeStories } from '@storybook/react';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';

import ManageLicenseModal from './ManageLicenseModal';
import * as stories from './ManageLicenseModal.stories';
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

const enterLicense = async (text: string) => {
	await userEvent.click(screen.getByRole('textbox'));
	await userEvent.paste(text);
};

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

test.each(testCases)(`renders %s without crashing`, async (_storyname, Story) => {
	const { baseElement } = render(<Story />, { wrapper: mockAppRoot().build() });
	expect(baseElement).toMatchSnapshot();
});

test.each(testCases)('%s should have no a11y violations', async (_storyname, Story) => {
	const { container } = render(<Story />, { wrapper: mockAppRoot().build() });

	const results = await axe(container);
	expect(results).toHaveNoViolations();
});

it('should show a success status for a valid license', async () => {
	render(<ManageLicenseModal enterpriseLicense='' onCancel={jest.fn()} />, {
		wrapper: mockAppRoot().withEndpoint('POST', '/v1/licenses.validate', validationSuccess).build(),
	});

	await enterLicense(LICENSE);

	expect(await screen.findByText('Valid_license')).toBeInTheDocument();
});

it('should map a validation failure to a specific message', async () => {
	render(<ManageLicenseModal enterpriseLicense='' onCancel={jest.fn()} />, {
		wrapper: mockAppRoot()
			.withEndpoint('POST', '/v1/licenses.validate', validationFailure(reasons(['invalidate_license', 'period'])))
			.build(),
	});

	await enterLicense(LICENSE);

	expect(await screen.findByText('License_error_expired')).toBeInTheDocument();
	expect(screen.getByText('Invalid_license')).toBeInTheDocument();
});

it('should show a generic message when validation fails for a non-license reason', async () => {
	render(<ManageLicenseModal enterpriseLicense='' onCancel={jest.fn()} />, {
		wrapper: mockAppRoot()
			.withEndpoint('POST', '/v1/licenses.validate', () => Promise.reject(new Error('network down')))
			.build(),
	});

	await enterLicense(LICENSE);

	expect(await screen.findByText('License_error_generic')).toBeInTheDocument();
});

it('should show a validating status while the request is in flight', async () => {
	const { fn, resolve } = createDeferredMockFn<null>();

	render(<ManageLicenseModal enterpriseLicense='' onCancel={jest.fn()} />, {
		wrapper: mockAppRoot().withEndpoint('POST', '/v1/licenses.validate', fn).build(),
	});

	await enterLicense(LICENSE);

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

it('should keep the apply button disabled after erasing a valid license', async () => {
	render(<ManageLicenseModal enterpriseLicense='' onCancel={jest.fn()} />, {
		wrapper: mockAppRoot().withEndpoint('POST', '/v1/licenses.validate', validationSuccess).build(),
	});

	await enterLicense(LICENSE);

	expect(await screen.findByText('Valid_license')).toBeInTheDocument();

	const applyButton = screen.getByRole('button', { name: 'Apply_license' });
	await waitFor(() => expect(applyButton).toBeEnabled());

	await userEvent.clear(screen.getByRole('textbox'));

	await waitFor(() => expect(applyButton).toBeDisabled());
});

it('should ask for confirmation before removing the current license', async () => {
	render(<ManageLicenseModal enterpriseLicense={LICENSE} onCancel={jest.fn()} />, {
		wrapper: mockAppRoot().withEndpoint('POST', '/v1/licenses.validate', validationSuccess).build(),
	});

	// The remove action only shows when the entered license is the applied one.
	await userEvent.click(await screen.findByRole('button', { name: 'Remove_license' }));

	expect(screen.getByRole('heading', { name: 'Remove_license_key' })).toBeInTheDocument();
});
