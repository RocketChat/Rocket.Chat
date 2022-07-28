import { MongoClient } from "mongodb";

import * as constants from '../config/constants';
import * as users from './collections/users';

export default async function populateDatabase() {
    const connection = await MongoClient.connect(constants.URL_MONGODB);

    await connection.db().collection('users').updateOne({ username: 'user1' }, {  $set: users.user1 }, { upsert: true });
}