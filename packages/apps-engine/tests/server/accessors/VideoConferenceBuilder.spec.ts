import { Expect, Test } from 'alsatian';

import type { AppVideoConference } from '../../../src/definition/videoConferences';
import { VideoConferenceBuilder } from '../../../src/server/accessors';
import { TestData } from '../../test-data/utilities';

export class VideoConferenceBuilderAccessorTestFixture {
    @Test()
    public basicVideoConferenceBuilderBuilder() {
        Expect(() => new VideoConferenceBuilder()).not.toThrow();
        Expect(() => new VideoConferenceBuilder(TestData.getAppVideoConference())).not.toThrow();
    }

    @Test()
    public setData() {
        const builder = new VideoConferenceBuilder();

        Expect(builder.setData({ providerName: 'test-provider' } as AppVideoConference)).toBe(builder);
        Expect(((builder as any).call as AppVideoConference).providerName).toBe('test-provider');
    }

    @Test()
    public setRoomId() {
        const call = {} as AppVideoConference;
        const builder = new VideoConferenceBuilder(call);

        Expect(builder.setRoomId('roomId')).toBe(builder);
        Expect(call.rid).toBe('roomId');
        Expect(builder.getRoomId()).toBe('roomId');

        Expect(builder.getVideoConference()).toBe(call);
    }

    @Test()
    public setCreatedBy() {
        const call = {} as AppVideoConference;
        const builder = new VideoConferenceBuilder(call);

        Expect(builder.setCreatedBy('userId')).toBe(builder);
        Expect(call.createdBy).toBe('userId');
        Expect(builder.getCreatedBy()).toBe('userId');

        Expect(builder.getVideoConference()).toBe(call);
    }

    @Test()
    public setProviderName() {
        const call = {} as AppVideoConference;
        const builder = new VideoConferenceBuilder(call);

        Expect(builder.setProviderName('test')).toBe(builder);
        Expect(call.providerName).toBe('test');
        Expect(builder.getProviderName()).toBe('test');

        Expect(builder.getVideoConference()).toBe(call);
    }

    @Test()
    public setProviderData() {
        const call = {} as AppVideoConference;
        const builder = new VideoConferenceBuilder(call);

        Expect(builder.setProviderData({ custom: true })).toBe(builder);
        Expect(call.providerData).toEqual({ custom: true });
        Expect(builder.getProviderData()).toEqual({ custom: true });

        Expect(builder.getVideoConference()).toBe(call);
    }

    @Test()
    public setTitle() {
        const call = {} as AppVideoConference;
        const builder = new VideoConferenceBuilder(call);

        Expect(builder.setTitle('Video Conference')).toBe(builder);
        Expect(call.title).toBe('Video Conference');
        Expect(builder.getTitle()).toBe('Video Conference');

        Expect(builder.getVideoConference()).toBe(call);
    }

    @Test()
    public setDiscussionRid() {
        const call = {} as AppVideoConference;
        const builder = new VideoConferenceBuilder(call);

        Expect(builder.setDiscussionRid('testId')).toBe(builder);
        Expect(call.discussionRid).toBe('testId');
        Expect(builder.getDiscussionRid()).toBe('testId');

        Expect(builder.getVideoConference()).toBe(call);
    }

    @Test()
    public initialData() {
        const call = { providerName: 'test' } as AppVideoConference;
        const builder = new VideoConferenceBuilder(call);

        Expect(call.providerName).toBe('test');
        Expect(builder.getProviderName()).toBe('test');

        Expect(builder.setProviderName('test2')).toBe(builder);
        Expect(call.providerName).toBe('test2');
        Expect(builder.getProviderName()).toBe('test2');

        Expect(builder.getVideoConference()).toBe(call);
    }
}
