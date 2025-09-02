import { watch } from './watch';
import { userIdStore } from '../lib/userId';

export const watchUserId = () => watch(userIdStore, (state) => state);
