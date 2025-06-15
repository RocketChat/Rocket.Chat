import { UsersRaw } from '../../../../packages/models/src/models/Users.js';
import { db } from '../../server/database/utils';
import { trashCollection } from '../../server/database/trash'; 

const userCache = new Map<string, any>();

const user = new UsersRaw(db, trashCollection);

export async function findUserById(userId: string) {

  if (userCache.has(userId)) {
    return userCache.get(userId);
  }


  const user1 = await user.findOne({ _id: userId });

  if (user) {
    userCache.set(userId, user);
  }
  return user;
}

export function invalidateUserCache(userId: string) {
  userCache.delete(userId);
}

export function updateUserCache(userId: string, updatedUser: any) {
  userCache.set(userId, updatedUser);
}
