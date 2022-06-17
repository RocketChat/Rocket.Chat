import { callbacks } from '../../../../../../lib/callbacks';
import { IFederationBridge } from '../../../domain/IFederationBridge';

class RocketChatRoomCallbacksHandler {
	private bridge: IFederationBridge;

	public injectBridgeInstance(bridgeInstance: IFederationBridge): void {
		this.bridge = bridgeInstance;
	}

	public async afterLeaveRoom(rocketUser: any, rocketRoom: any): Promise<void> {
		if (!this.bridge) return;

		this.bridge.leaveRoom(rocketRoom._id, rocketUser._id);

		return Promise.resolve();
	}
}

export const rocketChatRoomCallbacksHandler = new RocketChatRoomCallbacksHandler();

callbacks.add('afterLeaveRoom', rocketChatRoomCallbacksHandler.afterLeaveRoom);
