import { buildErrorReport } from './errorReport';

const chainOf = (length: number): Error =>
	Array.from({ length }, (_, index) => index).reduceRight<Error | undefined>(
		(cause, index) => new Error(`level ${index}`, { cause }),
		undefined,
	) as Error;

describe('buildErrorReport', () => {
	it('should describe an Error with its name, message and stack', () => {
		const error = new TypeError('boom');

		const report = buildErrorReport({ error });

		expect(report).toContain('TypeError: boom');
		expect(report).toContain(error.stack);
	});

	it('should describe a thrown value that is not an Error', () => {
		expect(buildErrorReport({ error: 'plain string' })).toContain('Thrown value: plain string');
	});

	it('should describe each cause in the chain', () => {
		const report = buildErrorReport({ error: chainOf(3) });

		expect(report).toContain('Error: level 0');
		expect(report.match(/Caused by:/g)).toHaveLength(2);
		expect(report).toContain('Error: level 2');
		expect(report).not.toContain('further causes omitted');
	});

	it('should mark the report when the cause chain is deeper than it describes', () => {
		const report = buildErrorReport({ error: chainOf(6) });

		expect(report).toContain('Error: level 3');
		expect(report).not.toContain('Error: level 4');
		expect(report).toContain('(further causes omitted)');
	});

	it('should include the optional environment lines and component stack when given', () => {
		const report = buildErrorReport({
			error: new Error('boom'),
			componentStack: '\n    at Component\n',
			routeName: 'home',
			version: '8.0.0',
			commitHash: 'abc123',
		});

		expect(report).toContain('Version: 8.0.0');
		expect(report).toContain('Commit: abc123');
		expect(report).toContain('Route: home');
		expect(report).toContain('--- Component stack ---\nat Component');
	});

	it('should leave out the optional environment lines and component stack when missing', () => {
		const report = buildErrorReport({ error: new Error('boom'), componentStack: null });

		expect(report).not.toContain('Version:');
		expect(report).not.toContain('Commit:');
		expect(report).not.toContain('Route:');
		expect(report).not.toContain('--- Component stack ---');
	});
});
