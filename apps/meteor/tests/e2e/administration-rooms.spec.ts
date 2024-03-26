import { Users } from './fixtures/userStates';
import { HomeDiscussion } from './page-objects';
import { test, expect } from './utils/test';

test.use({ storageState: Users.admin.state });

test.describe.serial('Rooms Administration', () => {

});
