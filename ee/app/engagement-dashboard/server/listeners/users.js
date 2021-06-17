import { callbacks } from '../../../../../server/utils/hooks';
import { handleUserCreated } from '../lib/users';

callbacks.add('afterCreateUser', handleUserCreated);
