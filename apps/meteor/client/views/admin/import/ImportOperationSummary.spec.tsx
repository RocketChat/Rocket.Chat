import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';

import ImportOperationSummary from './ImportOperationSummary';
import { ProgressStep } from '../../../../app/importer/lib/ImporterProgressStep';

const mockNavigate = jest.fn();

jest.mock('@rocket.chat/fuselage', () => ({
	TableRow: ({ children, ...props }: { children: ReactNode }) => <tr {...props}>{children}</tr>,
	TableCell: ({ children, is, ...props }: { children: ReactNode; is?: string }) => {
		const Tag = is === 'th' ? 'th' : 'td';

		return <Tag {...props}>{children}</Tag>;
	},
}));

jest.mock('@rocket.chat/ui-contexts', () => ({
	useRouter: () => ({ navigate: mockNavigate }),
}));

jest.mock('react-i18next', () => ({
	useTranslation: () => ({
		t: (key: string) =>
			({
				importer_status_import_failed: 'Import failed',
				importer_status_preparing_users: 'Preparing users',
			})[key] ?? key,
	}),
}));

jest.mock('../../../hooks/useFormatDateAndTime', () => ({
	useFormatDateAndTime: () => () => 'January 1, 2025',
}));

describe('ImportOperationSummary', () => {
	afterEach(() => {
		jest.clearAllMocks();
	});

	const renderComponent = (valid?: boolean) =>
		render(
			<table>
				<tbody>
					<ImportOperationSummary
						type='CSV'
						_updatedAt='2025-01-01T00:00:00.000Z'
						status={ProgressStep.PREPARING_USERS}
						file='20250101_user123_import.zip'
						user='user123'
						valid={valid}
					/>
				</tbody>
			</table>,
		);

	it('renders failed status when valid is false', () => {
		renderComponent(false);

		expect(screen.getByText('Import failed')).toBeInTheDocument();
		expect(screen.queryByText('Preparing users')).not.toBeInTheDocument();
	});
});
