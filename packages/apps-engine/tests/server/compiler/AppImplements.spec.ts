import { Expect, Test } from 'alsatian';

import { AppInterface } from '../../../src/definition/metadata';
import { AppImplements } from '../../../src/server/compiler';

export class AppImplementsTestFixture {
    @Test()
    public appImplements() {
        Expect(() => new AppImplements()).not.toThrow();

        const impls = new AppImplements();

        Expect(impls.getValues()).toBeDefined();
        Expect(() => impls.doesImplement(AppInterface.IPreMessageSentPrevent)).not.toThrow();
        Expect(impls.getValues()[AppInterface.IPreMessageSentPrevent]).toBe(true);
        Expect(() => impls.doesImplement('Something')).not.toThrow();
        Expect(impls.getValues().Something).not.toBeDefined();
    }
}
