import { Expect, Test } from 'alsatian';

import type { VideoConference } from '../../../src/definition/videoConferences';
import { VideoConferenceExtender } from '../../../src/server/accessors';
import { TestData } from '../../test-data/utilities';

export class VideoConferenceExtendAccessorTestFixture {
    @Test()
    public basicVideoConferenceExtend() {
        Expect(() => new VideoConferenceExtender({} as VideoConference)).not.toThrow();
        Expect(() => new VideoConferenceExtender(TestData.getVideoConference())).not.toThrow();
    }

    @Test()
    public setProviderData() {
        const call = {} as VideoConference;
        const extend = new VideoConferenceExtender(call);

        Expect(call.providerData).not.toBeDefined();
        Expect(extend.setProviderData({ key: 'test' })).toBe(extend);
        Expect(call.providerData).toBeDefined();
        Expect(call.providerData.key).toBe('test');

        Expect(extend.getVideoConference()).not.toBe(call);
        Expect(extend.getVideoConference()).toEqual(call);
    }

    @Test()
    public setStatus() {
        const call = { status: 0 } as VideoConference;
        const extend = new VideoConferenceExtender(call);

        Expect(call.status).toBe(0);
        Expect(extend.setStatus(1)).toBe(extend);
        Expect(call.status).toBe(1);
    }

    @Test()
    public setEndedBy() {
        const call = {} as VideoConference;
        const extend = new VideoConferenceExtender(call);

        Expect(call.endedBy).not.toBeDefined();
        Expect(extend.setEndedBy('userId')).toBe(extend);
        Expect(call.endedBy).toBeDefined();
        Expect(call.endedBy._id).toBe('userId');
    }

    @Test()
    public setEndedAt() {
        const call = {} as VideoConference;
        const extend = new VideoConferenceExtender(call);

        const date = new Date();

        Expect(call.endedAt).not.toBeDefined();
        Expect(extend.setEndedAt(date)).toBe(extend);
        Expect(call.endedAt).toBe(date);
    }

    @Test()
    public setDiscussionRid() {
        const call = {} as VideoConference;
        const extend = new VideoConferenceExtender(call);

        Expect(call.discussionRid).not.toBeDefined();
        Expect(extend.setDiscussionRid('testId')).toBe(extend);
        Expect(call.discussionRid).toBe('testId');
    }

    @Test()
    public addUser() {
        const call = { users: [] } as VideoConference;
        const extend = new VideoConferenceExtender(call);

        Expect(call.users).toBeEmpty();
        Expect(extend.addUser('userId')).toBe(extend);
        Expect(call.users).not.toBeEmpty();
        Expect(call.users[0]._id).toBe('userId');
    }
}
