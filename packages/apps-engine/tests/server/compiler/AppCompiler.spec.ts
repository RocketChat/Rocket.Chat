import { Expect, Test } from 'alsatian';

import { AppCompiler } from '../../../src/server/compiler';

export class AppCompilerTestFixture {
    @Test()
    public verifyStorageFileToCompiler() {
        const compiler = new AppCompiler();

        Expect(() => compiler.normalizeStorageFiles({})).not.toThrow();

        const files: { [key: string]: string } = {
            TestingApp$ts: 'act-like-this-is-real',
            TestingAppCommand$ts: 'something-here-as well, yay',
        };

        const expected: { [key: string]: string } = {
            'TestingApp.ts': files.TestingApp$ts,
            'TestingAppCommand.ts': files.TestingAppCommand$ts,
        };

        Expect(compiler.normalizeStorageFiles(files)).toEqual(expected);
    }
}
