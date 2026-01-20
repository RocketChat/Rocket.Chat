import { mockAppRoot } from '@rocket.chat/mock-providers';
import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';

import FileUploadModal from './FileUploadModal';
import * as stories from './FileUploadModal.stories';

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

const defaultProps = {
	onClose: () => undefined,
	file: new File([], 'testing.png', { type: 'image/png' }),
	fileName: 'testing.png',
	fileDescription: '',
	onSubmit: () => undefined,
	invalidContentType: false,
	showDescription: true,
};

const defaultWrapper = mockAppRoot().withTranslations('en', 'core', {
	Cannot_upload_file_character_limit: 'Cannot upload file, description is over the {{count}} character limit',
	Send: 'Send',
	Upload_file_name: 'File name',
	Upload_file_description: 'File description',
	FileUpload_MediaType_NotAccepted__type__: 'Media type not accepted: {{type}}',
});

test.each(testCases)(`renders %s without crashing`, async (_storyname, Story) => {
	const { baseElement } = render(<Story />);
	expect(baseElement).toMatchSnapshot();
});

test.each(testCases)('%s should have no a11y violations', async (_storyname, Story) => {
	const { container } = render(<Story />);

	const results = await axe(container);
	expect(results).toHaveNoViolations();
});

it('should not send a renamed file with not allowed mime-type', async () => {
	render(<FileUploadModal {...defaultProps} />, {
		wrapper: defaultWrapper.withSetting('FileUpload_MediaTypeBlackList', 'image/svg+xml').build(),
	});

	const input = await screen.findByRole('textbox', { name: 'File name' });
	await userEvent.type(input, 'testing.svg');

	const button = await screen.findByRole('button', { name: 'Send' });
	await userEvent.click(button);

	expect(screen.getByText('Media type not accepted: image/svg+xml')).toBeInTheDocument();
});
