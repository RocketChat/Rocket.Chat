import type { IWorkspaceToken } from '../cloud/IWorkspaceToken';

/**
 * Accessor that enables apps to read information
 * related to the Cloud connectivity of the workspace.
 *
 * Methods in this accessor will usually connect to the
 * Rocket.Chat Cloud, which means they won't work properly
 * in air-gapped environment.
 *
 * This accessor available via `IRead` object, which is
 * usually received as a parameter wherever it's available.
 */
export interface ICloudWorkspaceRead {
    /**
     * Returns an access token that can be used to access
     * Cloud Services on the workspace's behalf.
     *
     * @param scope The scope that the token should be authorized with
     *
     * @RequiresPermission cloud.workspace-token; scopes: Array<string>
     */
    getWorkspaceToken(scope: string): Promise<IWorkspaceToken>;
}
