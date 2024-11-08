export class CustomMatcherRegistrar {

    public withJestMatcher(name: string, fn: (...args: any) => { pass: boolean; message: () => string }): CustomMatcherRegistrar {
        expect.extend({
            [name]: fn.bind(fn),
        });

        return this;
    }
    
    public withJestAsyncMatcher(name: string, fn: (...args: any) => Promise<{ pass: boolean; message: () => string }>): CustomMatcherRegistrar {
        expect.extend({
            [name]: fn.bind(fn),
        });

        return this;
    }
}