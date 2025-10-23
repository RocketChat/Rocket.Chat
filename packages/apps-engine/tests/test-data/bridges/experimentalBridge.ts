import { ExperimentalBridge } from '../../../src/server/bridges';

export class TestExperimentalBridge extends ExperimentalBridge {
	protected getUserRoomIds(userId: string, appId: string): Promise<string[] | undefined> {
		throw new Error('Method not implemented.');
	}
}
