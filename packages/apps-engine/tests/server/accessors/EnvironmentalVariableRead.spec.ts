import { AsyncTest, Expect, SetupFixture } from 'alsatian';

import { EnvironmentalVariableRead } from '../../../src/server/accessors';
import type { EnvironmentalVariableBridge } from '../../../src/server/bridges';

export class EnvironmentalVariableReadAccessorTestFixture {
    private mockEnvVarBridge: EnvironmentalVariableBridge;

    @SetupFixture
    public setupFixture() {
        this.mockEnvVarBridge = {
            doGetValueByName(name: string, appId: string): Promise<string> {
                return Promise.resolve('value');
            },
            doIsReadable(name: string, appId: string): Promise<boolean> {
                return Promise.resolve(true);
            },
            doIsSet(name: string, appId: string): Promise<boolean> {
                return Promise.resolve(false);
            },
        } as EnvironmentalVariableBridge;
    }

    @AsyncTest()
    public async useEnvironmentalVariableRead() {
        Expect(() => new EnvironmentalVariableRead(this.mockEnvVarBridge, 'testing')).not.toThrow();

        const evr = new EnvironmentalVariableRead(this.mockEnvVarBridge, 'testing');
        Expect(await evr.getValueByName('testing')).toBe('value');
        Expect(await evr.isReadable('testing')).toBeTruthy();
        Expect(await evr.isSet('testing2')).not.toBeTruthy();
    }
}
