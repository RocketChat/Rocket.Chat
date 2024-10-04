import { EnvironmentalVariableBridge } from '../../../src/server/bridges/EnvironmentalVariableBridge';

export class TestsEnvironmentalVariableBridge extends EnvironmentalVariableBridge {
    public getValueByName(envVarName: string, appId: string): Promise<string> {
        throw new Error('Method not implemented.');
    }

    public isReadable(envVarName: string, appId: string): Promise<boolean> {
        throw new Error('Method not implemented.');
    }

    public isSet(envVarName: string, appId: string): Promise<boolean> {
        throw new Error('Method not implemented.');
    }
}
