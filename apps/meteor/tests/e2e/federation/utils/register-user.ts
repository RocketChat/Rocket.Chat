import faker from '@faker-js/faker';
import * as constants from '../config/constants';

import type { BaseTest } from '../../utils/test';

export async function registerUser(api: BaseTest['api']): Promise<string> {
    const username = faker.datatype.uuid();

    await api.post('/users.register', {
        username,
        email: `${ username }@test-rc.com`,
        pass: constants.RC_SERVER_2.password,
        name: username,
    });

    return username;
}
