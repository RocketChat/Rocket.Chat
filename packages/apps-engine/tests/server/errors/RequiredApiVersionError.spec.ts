import { Expect, Test } from 'alsatian';

import type { IAppInfo } from '../../../src/definition/metadata';
import { RequiredApiVersionError } from '../../../src/server/errors';

export class RequiredApiVersionErrorTestFixture {
    @Test()
    public verifyCompilerError() {
        const info = {
            requiredApiVersion: '1.0.1',
            name: 'Testing',
            id: 'fake-id',
        } as IAppInfo;
        const er = new RequiredApiVersionError(info, '1.0.0');

        Expect(er.name).toBe('RequiredApiVersion');
        Expect(er.message).toBe('Failed to load the App "Testing" (fake-id) as it requires v1.0.1 of the App API however your server comes with v1.0.0.');

        const er2 = new RequiredApiVersionError(info, '2.0.0');

        Expect(er2.name).toBe('RequiredApiVersion');
        Expect(er2.message).toBe(
            'Failed to load the App "Testing" (fake-id) as it requires v1.0.1 of the App API however your server comes with v2.0.0. Please tell the author to update their App as it is out of date.',
        );
    }
}
