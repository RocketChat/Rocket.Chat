import { Expect, Test } from 'alsatian';

import { MustExtendAppError } from '../../../src/server/errors';

export class MustExtendAppErrorTestFixture {
    @Test()
    public verifyCompilerError() {
        const er = new MustExtendAppError();

        Expect(er.name).toBe('MustExtendApp');
        Expect(er.message).toBe('App must extend the "App" abstract class.');
    }
}
