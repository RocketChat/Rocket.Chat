import type { DDPSDK } from '../src';

// Checked by `yarn typecheck`; the body never runs.
const typeAssertions = (sdk: DDPSDK) => {
	// @ts-expect-error checkRegistrationSecretURL resolves with a boolean
	const number: Promise<number> = sdk.client.callAsync('checkRegistrationSecretURL', 'hash');
	const boolean: Promise<boolean> = sdk.client.callAsync('checkRegistrationSecretURL', 'hash');
	const untyped: Promise<any> = sdk.client.callAsync('not-a-typed-method', 1, 2);
	// @ts-expect-error checkRegistrationSecretURL takes a string hash
	const wrongParams = sdk.client.callAsync('checkRegistrationSecretURL', 123);
	// @ts-expect-error sdk.call is typed like callAsync
	const wrongCall: Promise<number> = sdk.call('checkRegistrationSecretURL', 'hash');

	const received: [string, boolean][] = [];
	sdk.stream('notify-room', 'rid/typing', (username, typing) => {
		received.push([username, typing]);
		// @ts-expect-error the second argument is the boolean typing flag
		received.push([typing, username]);
	});

	return [number, boolean, untyped, wrongParams, wrongCall, received];
};

it('keeps the type assertions in the typecheck', () => {
	expect(typeof typeAssertions).toBe('function');
});
