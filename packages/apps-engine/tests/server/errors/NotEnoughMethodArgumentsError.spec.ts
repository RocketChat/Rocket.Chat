import { Expect, Test } from 'alsatian';

import { NotEnoughMethodArgumentsError } from '../../../src/server/errors';

export class NotEnoughMethodArgumentsErrorTestFixture {
    @Test()
    public verifyCompilerError() {
        const er = new NotEnoughMethodArgumentsError('enable', 3, 1);

        Expect(er.name).toBe('NotEnoughMethodArgumentsError');
        Expect(er.message).toBe('The method "enable" requires 3 parameters but was only passed 1.');
    }
}
