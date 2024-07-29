import { Expect, Test } from 'alsatian';

import { MustContainFunctionError } from '../../../src/server/errors';

export class MustContainFunctionErrorTestFixture {
    @Test()
    public verifyCompilerError() {
        const er = new MustContainFunctionError('App.ts', 'getVersion');

        Expect(er.name).toBe('MustContainFunction');
        Expect(er.message).toBe('The App (App.ts) doesn\'t have a "getVersion" function which is required.');
    }
}
