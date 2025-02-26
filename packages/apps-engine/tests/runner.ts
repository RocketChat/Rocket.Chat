import { TestRunner, TestSet } from 'alsatian';
import { TapBark } from 'tap-bark';

(async function _appEngineTestRunner() {
    const testSet = TestSet.create();
    testSet.addTestsFromFiles('./**/*.spec.ts');

    const testRunner = new TestRunner();

    if (!process.argv.includes('--no-tap')) {
        testRunner.outputStream.pipe(TapBark.create().getPipeable()).pipe(process.stdout);
    } else {
        testRunner.outputStream.pipe(process.stdout);
    }

    await testRunner.run(testSet);
})().catch((e) => {
    console.error(e);
    process.exit(1);
});
