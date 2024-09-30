import type { IRole } from '../roles';

/**
 * Interface for reading roles.
 */
export interface IRoleRead {
    /**
     * Retrieves a role by its id or name.
     * @param idOrName The id or name of the role to retrieve.
     * @param appId The id of the app.
     * @returns The role, if found.
     * @returns null if no role is found.
     * @throws If there is an error while retrieving the role.
     */
    getOneByIdOrName(idOrName: IRole['id'] | IRole['name'], appId: string): Promise<IRole | null>;

    /**
     * Retrieves all custom roles.
     * @param appId The id of the app.
     * @returns All custom roles.
     * @throws If there is an error while retrieving the roles.
     * @throws If the app does not have the necessary permissions.
     * @see IRole.protected
     * @see AppPermissions.role.read
     */
    getCustomRoles(appId: string): Promise<Array<IRole>>;
}
