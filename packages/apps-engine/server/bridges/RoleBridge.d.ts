import { BaseBridge } from './BaseBridge';
import type { IRole } from '../../definition/roles';
export declare abstract class RoleBridge extends BaseBridge {
    doGetOneByIdOrName(idOrName: IRole['id'] | IRole['name'], appId: string): Promise<IRole | null>;
    doGetCustomRoles(appId: string): Promise<Array<IRole>>;
    protected abstract getOneByIdOrName(idOrName: IRole['id'] | IRole['name'], appId: string): Promise<IRole | null>;
    protected abstract getCustomRoles(appId: string): Promise<Array<IRole>>;
    private hasReadPermission;
}
