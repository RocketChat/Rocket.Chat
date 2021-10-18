import { callbacks } from '../../../../../app/callbacks/server';
import { handleUserCreated } from '../lib/users';

callbacks.add('afterCreateUser', handleUserCreated);
