import type { IRoleRead } from '../../definition/accessors/IRoleRead';
import type { IRole } from '../../definition/roles';
import type { RoleBridge } from '../bridges';
export declare class RoleRead implements IRoleRead {
    private roleBridge;
    private appId;
    constructor(roleBridge: RoleBridge, appId: string);
    getOneByIdOrName(idOrName: IRole['id'] | IRole['name']): Promise<IRole | null>;
    getCustomRoles(): Promise<Array<IRole>>;
}
