import type { IEnvironmentalVariableRead } from '../../definition/accessors';
import type { EnvironmentalVariableBridge } from '../bridges';
export declare class EnvironmentalVariableRead implements IEnvironmentalVariableRead {
    private readonly bridge;
    private readonly appId;
    constructor(bridge: EnvironmentalVariableBridge, appId: string);
    getValueByName(envVarName: string): Promise<string>;
    isReadable(envVarName: string): Promise<boolean>;
    isSet(envVarName: string): Promise<boolean>;
}
