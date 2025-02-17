import { BaseBridge } from './BaseBridge';
import type { IWorkspaceToken } from '../../definition/cloud/IWorkspaceToken';
export declare abstract class CloudWorkspaceBridge extends BaseBridge {
    doGetWorkspaceToken(scope: string, appId: string): Promise<IWorkspaceToken>;
    protected abstract getWorkspaceToken(scope: string, appId: string): Promise<IWorkspaceToken>;
    private hasCloudTokenPermission;
}
