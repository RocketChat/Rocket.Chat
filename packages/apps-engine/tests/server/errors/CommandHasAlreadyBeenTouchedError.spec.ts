import { Expect, Test } from 'alsatian';

import { CommandHasAlreadyBeenTouchedError } from '../../../src/server/errors';

export class CommandHasAlreadyBeenTouchedErrorTestFixture {
    @Test()
    public verifyCommandHasAlreadyBeenTouched() {
        const er = new CommandHasAlreadyBeenTouchedError('testing');

        Expect(er.name).toBe('CommandHasAlreadyBeenTouched');
        Expect(er.message).toBe('The command "testing" has already been touched by another App.');
    }
}
