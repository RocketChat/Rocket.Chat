import { Expect, Test } from 'alsatian';

import { CompilerError } from '../../../src/server/errors';

export class CompilerErrorTestFixture {
    @Test()
    public verifyCompilerError() {
        const er = new CompilerError('syntax');

        Expect(er.name).toBe('CompilerError');
        Expect(er.message).toBe('An error occured while compiling an App: syntax');
    }
}
