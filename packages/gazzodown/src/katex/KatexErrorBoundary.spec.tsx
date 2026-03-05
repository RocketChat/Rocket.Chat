import { render, screen } from '@testing-library/react';

import KatexErrorBoundary from './KatexErrorBoundary';

const ThrowingComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
	if (shouldThrow) {
		throw new Error('Katex parse error');
	}
	return <span>valid content</span>;
};

describe('KatexErrorBoundary', () => {
	beforeEach(() => {
		jest.spyOn(console, 'error').mockImplementation(() => undefined);
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('renders children when no error occurs', () => {
		render(
			<KatexErrorBoundary code='x^2'>
				<span>math content</span>
			</KatexErrorBoundary>,
		);

		expect(screen.getByText('math content')).toBeInTheDocument();
	});

	it('renders fallback with code text when child throws', () => {
		render(
			<KatexErrorBoundary code='invalid_code'>
				<ThrowingComponent shouldThrow />
			</KatexErrorBoundary>,
		);

		expect(screen.getByText('invalid_code')).toBeInTheDocument();
		expect(screen.queryByText('valid content')).not.toBeInTheDocument();
	});

	it('renders fallback with error message as title', () => {
		render(
			<KatexErrorBoundary code='bad code'>
				<ThrowingComponent shouldThrow />
			</KatexErrorBoundary>,
		);

		expect(screen.getByText('bad code')).toHaveAttribute('title', 'Katex parse error');
	});

	it('matches snapshot for error state', () => {
		const { container } = render(
			<KatexErrorBoundary code='\\broken'>
				<ThrowingComponent shouldThrow />
			</KatexErrorBoundary>,
		);
		expect(container).toMatchSnapshot();
	});

	it('matches snapshot for success state', () => {
		const { container } = render(
			<KatexErrorBoundary code='x^2'>
				<span>rendered math</span>
			</KatexErrorBoundary>,
		);
		expect(container).toMatchSnapshot();
	});
});
