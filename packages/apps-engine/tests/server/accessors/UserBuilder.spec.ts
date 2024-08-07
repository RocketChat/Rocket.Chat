import { Expect, Test } from 'alsatian';

import type { IUser, IUserEmail } from '../../../src/definition/users';
import { UserBuilder } from '../../../src/server/accessors';

export class UserBuilderAccessorTestFixture {
    @Test()
    public basicUserBuilder() {
        Expect(() => new UserBuilder()).not.toThrow();
    }

    @Test()
    public settingOnUserBuilder() {
        const ubOnce = new UserBuilder();
        Expect(ubOnce.setData({ name: 'Test User', email: 'testuser@gmail.com', username: 'testuser' } as Partial<IUser>)).toBe(ubOnce);
        Expect((ubOnce as any).user.name).toBe('Test User');
        Expect((ubOnce as any).user.username).toBe('testuser');
        Expect((ubOnce as any).user.email).toBe('testuser@gmail.com');

        const user: Partial<IUser> = {} as Partial<IUser>;
        const ub = new UserBuilder(user);

        Expect(
            ub.setEmails([
                {
                    address: 'testuser@gmail.com',
                    verified: false,
                } as IUserEmail,
            ]),
        ).toBe(ub);
        Expect(user.emails).toEqual([
            {
                address: 'testuser@gmail.com',
                verified: false,
            } as IUserEmail,
        ]);
        Expect(ub.getEmails()).toEqual([
            {
                address: 'testuser@gmail.com',
                verified: false,
            } as IUserEmail,
        ]);

        Expect(ub.setDisplayName('Test User')).toBe(ub);
        Expect(user.name).toEqual('Test User');
        Expect(ub.getDisplayName()).toEqual('Test User');

        Expect(ub.setUsername('testuser')).toBe(ub);
        Expect(user.username).toEqual('testuser');
        Expect(ub.getUsername()).toEqual('testuser');

        Expect(ub.setRoles(['bot'])).toBe(ub);
        Expect(user.roles).toEqual(['bot']);
        Expect(ub.getRoles()).toEqual(['bot']);

        Expect(ub.getUser()).toBe(user);
    }
}
