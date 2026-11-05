import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';

import AISearchErrorCallout from './AISearchErrorCallout';

import '@testing-library/jest-dom';

const renderCallout = (props: ComponentProps<typeof AISearchErrorCallout>, permissions: string[] = []) => {
	const navigate = jest.fn();
	const root = mockAppRoot()
		.withTranslations('en', 'core', {
			AI_Search_error_credentials_rejected_title: 'Invalid search pipeline credentials',
			AI_Search_error_credentials_rejected_description: 'Check the API key and secret.',
			AI_Search_error_not_responding_title: 'AI search is not responding',
			AI_Search_error_not_responding_description: 'Check the server status and connection URL.',
			AI_Search_error_unavailable_title: 'AI search is unavailable',
			AI_Search_error_url_blocked_title: 'Search pipeline URL is blocked',
			AI_Search_error_request_failed_title: 'AI search could not load results',
			AI_Search_error_try_again_description: 'Try again in a moment.',
			AI_Search_error_not_configured_title: 'AI search is not configured',
			AI_Search_error_not_configured_description: 'A workspace admin needs to configure it.',
			Intelligent_Search_missing_configuration_title: 'AI search needs configuration',
			Try_again: 'Try again',
			Open_AI_center: 'Open AI center',
		})
		.withRouter({ navigate });
	permissions.forEach((permission) => root.withPermission(permission));

	render(<AISearchErrorCallout {...props} />, { wrapper: root.build() });

	return { navigate };
};

describe('AISearchErrorCallout', () => {
	it('shows users a generic message whatever the cause, with a retry', async () => {
		const onRetry = jest.fn();
		renderCallout({ error: { errorType: 'error-ai-search-credentials-rejected' }, onRetry });

		expect(screen.getByText('AI search is unavailable')).toBeInTheDocument();
		expect(screen.queryByText('Invalid search pipeline credentials')).not.toBeInTheDocument();

		await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
		expect(onRetry).toHaveBeenCalledTimes(1);
	});

	it('tells admins the cause and links to AI center when settings need fixing', async () => {
		const { navigate } = renderCallout({ error: { errorType: 'error-ai-search-credentials-rejected' } }, ['view-privileged-setting']);

		expect(screen.getByText('Invalid search pipeline credentials')).toBeInTheDocument();
		expect(screen.getByText('Check the API key and secret.')).toBeInTheDocument();

		await userEvent.click(screen.getByRole('button', { name: 'Open AI center' }));
		expect(navigate).toHaveBeenCalledWith({ name: 'admin-ai-center', params: { section: 'search' } });
	});

	it('needs a pipeline setting permission on top of manage-selected-settings to show admin details', () => {
		renderCallout({ error: { errorType: 'error-ai-search-credentials-rejected' } }, ['manage-selected-settings']);
		expect(screen.getByText('AI search is unavailable')).toBeInTheDocument();
	});

	it('shows admin details to users allowed to change a pipeline setting', () => {
		renderCallout({ error: { errorType: 'error-ai-search-credentials-rejected' } }, [
			'manage-selected-settings',
			'change-setting-AI_Intelligent_Search_API_Key',
		]);
		expect(screen.getByText('Invalid search pipeline credentials')).toBeInTheDocument();
	});

	it('offers admins a retry when the pipeline timed out', () => {
		renderCallout({ error: { errorType: 'error-ai-search-timeout' }, onRetry: jest.fn() }, ['view-privileged-setting']);

		expect(screen.getByText('AI search is not responding')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
	});

	it('tells admins when SSRF protection blocked the pipeline URL', () => {
		renderCallout({ error: { errorType: 'error-ai-search-url-blocked' } }, ['view-privileged-setting']);

		expect(screen.getByText('Search pipeline URL is blocked')).toBeInTheDocument();
		expect(screen.queryByText('AI search is not responding')).not.toBeInTheDocument();
	});

	it('treats unrecognized errors as a failed request', () => {
		renderCallout({ error: new Error('network down'), onRetry: jest.fn() }, ['view-privileged-setting']);

		expect(screen.getByText('AI search could not load results')).toBeInTheDocument();
	});

	it('tells users an admin has to configure AI search, without actions', () => {
		renderCallout({ notConfigured: true });

		expect(screen.getByText('AI search is not configured')).toBeInTheDocument();
		expect(screen.queryByRole('button')).not.toBeInTheDocument();
	});

	it('sends admins to AI center when AI search is not configured', () => {
		renderCallout({ notConfigured: true }, ['edit-privileged-setting']);

		expect(screen.getByText('AI search needs configuration')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Open AI center' })).toBeInTheDocument();
	});
});
