import type { IWorkspaceToken } from '../../../src/definition/cloud/IWorkspaceToken';
import { CloudWorkspaceBridge } from '../../../src/server/bridges/CloudWorkspaceBridge';

export class TestAppCloudWorkspaceBridge extends CloudWorkspaceBridge {
    constructor() {
        super();
    }

    public async getWorkspaceToken(scope: string, appId: string): Promise<IWorkspaceToken> {
        return {
            token: 'mock-workspace-token',
            expiresAt: new Date(Date.now() + 10000),
        };
    }
}
