import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Suspense } from 'react';

import { MarkupInteractionContext } from '../MarkupInteractionContext';
import CodeBlock from './CodeBlock';

jest.mock('highlight.js', () => ({
	highlightElement: (): void => undefined,
}));

jest.mock('@rocket.chat/ui-contexts', () => ({
	useToastMessageDispatch: jest.fn(() => jest.fn()),
}));

jest.mock('react-i18next', () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));

const codeLines = (strings: string[]) =>
	strings.map((value) => ({ type: 'CODE_LINE' as const, value: { type: 'PLAIN_TEXT' as const, value } }));

const renderCodeBlock = (props: Parameters<typeof CodeBlock>[0]) =>
	render(
		<Suspense fallback={null}>
			<CodeBlock {...props} />
		</Suspense>,
	);

describe('CodeBlock', () => {
	it('renders code content from lines', async () => {
		renderCodeBlock({ lines: codeLines(['const x = 1;']) });

		const region = await screen.findByRole('region');
		expect(region).toHaveTextContent('const x = 1;');
	});

	it('renders multi-line code', async () => {
		renderCodeBlock({ lines: codeLines(['line one', 'line two', 'line three']) });

		const region = await screen.findByRole('region');
		expect(region).toHaveTextContent('line one');
		expect(region).toHaveTextContent('line two');
		expect(region).toHaveTextContent('line three');
	});

	it('applies language class when language is provided', async () => {
		renderCodeBlock({ lines: codeLines(['x = 1']), language: 'python' });

		const code = await screen.findByRole('code');
		expect(code).toHaveClass('language-python');
	});

	it('applies code-colors class without language class when language is undefined', async () => {
		renderCodeBlock({ lines: codeLines(['x = 1']) });

		const code = await screen.findByRole('code');
		expect(code).toHaveClass('code-colors');
		expect(code.className).not.toContain('language-');
	});

	it('applies code-colors class when language is "none"', async () => {
		renderCodeBlock({ lines: codeLines(['x = 1']), language: 'none' });

		const code = await screen.findByRole('code');
		expect(code).toHaveClass('code-colors');
		expect(code.className).not.toContain('language-');
	});

	it('renders copy button', async () => {
		renderCodeBlock({ lines: codeLines(['hello']) });

		const button = await screen.findByTitle('Copy');
		expect(button).toBeInTheDocument();
	});

	it('copies code to clipboard on copy button click', async () => {
		const writeText = jest.fn().mockResolvedValue(undefined);
		Object.assign(navigator, { clipboard: { writeText } });

		renderCodeBlock({ lines: codeLines(['const a = 1;', 'const b = 2;']) });

		const button = await screen.findByTitle('Copy');
		await userEvent.click(button);

		expect(writeText).toHaveBeenCalledWith('const a = 1;\nconst b = 2;');
	});

	it('renders highlighted text when highlightRegex is provided', async () => {
		render(
			<Suspense fallback={null}>
				<MarkupInteractionContext.Provider value={{ highlightRegex: () => /(hello)/gi }}>
					<CodeBlock lines={codeLines(['hello world'])} />
				</MarkupInteractionContext.Provider>
			</Suspense>,
		);

		const region = await screen.findByRole('region');
		expect(region).toHaveTextContent('hello world');
		// eslint-disable-next-line testing-library/no-node-access
		const mark = region.querySelector('mark.highlight-text');
		expect(mark).toBeInTheDocument();
		expect(mark).toHaveTextContent('hello');
	});

	it('renders empty code block with no lines', async () => {
		renderCodeBlock({ lines: [] });

		const region = await screen.findByRole('region');
		expect(region).toBeInTheDocument();
	});

	it('matches snapshot', async () => {
		const { container } = renderCodeBlock({ lines: codeLines(['const x = 42;']), language: 'javascript' });

		expect(await screen.findByRole('region')).toBeInTheDocument();
		expect(container).toMatchSnapshot();
	});
});
