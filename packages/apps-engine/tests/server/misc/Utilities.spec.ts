import { Expect, Test } from 'alsatian';

import { Utilities } from '../../../src/server/misc/Utilities';

export class UtilitiesTestFixture {
    private expectedInfo = {
        id: '614055e2-3dba-41fb-be48-c1ff146f5932',
        name: 'Testing App',
        nameSlug: 'testing-app',
        description: 'A Rocket.Chat Application used to test out the various features.',
        version: '0.0.8',
        requiredApiVersion: '>=0.9.6',
        author: {
            name: 'Bradley Hilton',
            homepage: 'https://github.com/RocketChat/Rocket.Chat.Apps-ts-definitions',
            support: 'https://github.com/RocketChat/Rocket.Chat.Apps-ts-definitions/issues',
        },
        classFile: 'TestingApp.ts',
        iconFile: 'testing.jpg',
    };

    @Test()
    public testDeepClone() {
        Expect(() => Utilities.deepClone(this.expectedInfo)).not.toThrow();
        const info = Utilities.deepClone(this.expectedInfo);

        Expect(info).toEqual(this.expectedInfo);
        info.name = 'New Testing App';
        Expect(info.name).toEqual('New Testing App');
        Expect(info.author.name).toEqual(this.expectedInfo.author.name);
    }

    @Test()
    public testDeepFreeze() {
        Expect(() => {
            this.expectedInfo.name = 'New Testing App';
        }).not.toThrow();
        Expect(() => {
            this.expectedInfo.author.name = 'Bradley H';
        }).not.toThrow();
        Expect(this.expectedInfo.name).toEqual('New Testing App');
        Expect(this.expectedInfo.author.name).toEqual('Bradley H');

        Expect(() => Utilities.deepFreeze(this.expectedInfo)).not.toThrow();

        Expect(() => {
            this.expectedInfo.name = 'Old Testing App';
        }).toThrow();
        Expect(() => {
            this.expectedInfo.author.name = 'Bradley';
        }).toThrow();
        Expect(this.expectedInfo.name).toEqual('New Testing App');
        Expect(this.expectedInfo.author.name).toEqual('Bradley H');
    }

    @Test()
    public testDeepCloneAndFreeze() {
        Expect(() => Utilities.deepCloneAndFreeze({})).not.toThrow();

        const info = Utilities.deepCloneAndFreeze(this.expectedInfo);
        Expect(info).toEqual(this.expectedInfo);
        Expect(info).not.toBe(this.expectedInfo);
        Expect(info.author.name).toEqual(this.expectedInfo.author.name);
        Expect(info.author.name).toEqual('Bradley H'); // was changed on testDeepFreeze
        Expect(() => {
            info.author.name = 'Bradley Hilton';
        }).toThrow();
    }
}
