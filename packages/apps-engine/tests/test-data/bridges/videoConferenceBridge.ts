import type { IVideoConfProvider } from '../../../src/definition/videoConfProviders';
import type { VideoConference, AppVideoConference } from '../../../src/definition/videoConferences';
import { VideoConferenceBridge } from '../../../src/server/bridges';

export class TestsVideoConferenceBridge extends VideoConferenceBridge {
    public getById(callId: string, appId: string): Promise<VideoConference> {
        throw new Error('Method not implemented.');
    }

    public create(call: AppVideoConference, appId: string): Promise<string> {
        throw new Error('Method not implemented');
    }

    public update(call: VideoConference, appId: string): Promise<void> {
        throw new Error('Method not implemented.');
    }

    protected registerProvider(info: IVideoConfProvider, appId: string): Promise<void> {
        return Promise.resolve();
    }

    protected unRegisterProvider(info: IVideoConfProvider, appId: string): Promise<void> {
        return Promise.resolve();
    }
}
