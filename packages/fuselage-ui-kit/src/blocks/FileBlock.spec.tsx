import { MockedServerContext } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import { messageParser } from '../surfaces';

const renderBlocks = (block: Record<string, unknown>) =>
	render(<MockedServerContext>{messageParser.render([{ type: 'file', ...block } as never])}</MockedServerContext>);

it('links to the uploaded file', () => {
	renderBlocks({ file_id: 'abc123' });

	expect(screen.getByRole('link')).toHaveAttribute('href', expect.stringContaining('/file-upload/abc123/file'));
});

it('renders nothing for a file kept in a store other than the workspace', () => {
	renderBlocks({ file_id: 'abc123', source: 'remote' });

	expect(screen.queryByRole('link')).not.toBeInTheDocument();
});
