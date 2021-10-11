import { callbacks } from '../../../../../lib/callbacks';
import { handleUserCreated } from '../lib/users';

callbacks.add('afterCreateUser', handleUserCreated);
