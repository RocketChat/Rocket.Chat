import { CustomMatcherRegistrar } from "../../shared/custom-matcher-registrar";

export const registerExternalAPICustomMatchers = (): void => {
    new CustomMatcherRegistrar()
        .withJestMatcher('toMatchExternalAPIValidationErrors', ({ input, errorName, errors }:
            {
                input: { name: string; errors: { property: string; constraints: Record<string, string> }[] };
                errorName: string;
                errors: Record<string, Record<string, string>>
            }): { pass: boolean; message: () => string } => {

            const keys = Object.keys(errors);

            expect(input.name).toBe(errorName);

            input.errors.forEach((error) => {
                if (!keys.includes(error.property)) {
                    return { pass: false, message: (): string => `${error.property} was returned but its not present on the errors object` };
                }
                expect(error.constraints).toEqual(errors[error.property]);
            });

            return { pass: true, message: () => '' };
        });
}