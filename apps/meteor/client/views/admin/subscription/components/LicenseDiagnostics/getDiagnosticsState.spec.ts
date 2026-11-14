import { getDiagnosticsState } from './getDiagnosticsState';
import type { DiagnosticsStateName } from './getDiagnosticsState';
import { licenseDiagnosticsByState } from './licenseDiagnosticsFixtures';

it.each(Object.entries(licenseDiagnosticsByState) as [DiagnosticsStateName, (typeof licenseDiagnosticsByState)[DiagnosticsStateName]][])(
	'should diagnose the %s state',
	(name, diagnostics) => {
		expect(getDiagnosticsState(diagnostics).name).toBe(name);
	},
);

it.each([
	['valid', 'valid'],
	['invalid', 'invalid'],
] as const)('should diagnose a %s license with no stored token as %s', (status, name) => {
	expect(getDiagnosticsState({ ...licenseDiagnosticsByState.valid, status, diagnosed: undefined, candidates: [] }).name).toBe(name);
});
