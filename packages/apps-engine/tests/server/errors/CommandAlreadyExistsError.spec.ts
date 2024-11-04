import { Expect, Test } from 'alsatian';

import { CommandAlreadyExistsError } from '../../../src/server/errors';

export class CommandAlreadyExistsErrorTestFixture {
    @Test()
    public verifyCommandAlreadyExistsError() {
        const er = new CommandAlreadyExistsError('testing');

        Expect(er.name).toBe('CommandAlreadyExists');
        Expect(er.message).toBe('The command "testing" already exists in the system.');
    }
}
