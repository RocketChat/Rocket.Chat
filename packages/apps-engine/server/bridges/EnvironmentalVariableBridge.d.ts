import { BaseBridge } from './BaseBridge';
export declare abstract class EnvironmentalVariableBridge extends BaseBridge {
    doGetValueByName(envVarName: string, appId: string): Promise<string | undefined>;
    doIsReadable(envVarName: string, appId: string): Promise<boolean>;
    doIsSet(envVarName: string, appId: string): Promise<boolean>;
    protected abstract getValueByName(envVarName: string, appId: string): Promise<string | undefined>;
    protected abstract isReadable(envVarName: string, appId: string): Promise<boolean>;
    protected abstract isSet(envVarName: string, appId: string): Promise<boolean>;
    private hasReadPermission;
}
