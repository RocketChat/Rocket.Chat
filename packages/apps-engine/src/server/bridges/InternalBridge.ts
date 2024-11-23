import { BaseBridge } from './BaseBridge';
import type { ISetting } from '../../definition/settings';

export abstract class InternalBridge extends BaseBridge {
    public doGetUsernamesOfRoomById(roomId: string): Promise<Array<string>> {
        return this.getUsernamesOfRoomById(roomId);
    }

    public doGetUsernamesOfRoomByIdSync(roomId: string): Array<string> {
        return this.getUsernamesOfRoomByIdSync(roomId);
    }

    public async doGetWorkspacePublicKey(): Promise<ISetting> {
        return this.getWorkspacePublicKey();
    }

    protected abstract getUsernamesOfRoomById(roomId: string): Promise<Array<string>>;

    protected abstract getUsernamesOfRoomByIdSync(roomId: string): Array<string>;

    protected abstract getWorkspacePublicKey(): Promise<ISetting>;
}
