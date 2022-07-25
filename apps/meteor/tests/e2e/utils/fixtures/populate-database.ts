import { MongoClient } from 'mongodb'
import { IRoom, IUser, ISubscription } from '@rocket.chat/core-typings';

import { URL_MONGODB } from '../constants'

import * as rooms from './collections/rocketchat_room'
import * as users from './collections/users'
import * as subscriptions from './collections/rocketchat_subscription'

export default {
    async up() {
        const connection = await MongoClient.connect(URL_MONGODB);

        await connection.db().collection<IRoom>('rocketchat_room').insertOne(rooms.roomPublic1)
        await connection.db().collection<IRoom>('rocketchat_room').insertOne(rooms.roomPrivate1)
    
        await connection.db().collection<IUser>('users').insertOne(users.userSimple1)
    
        await connection.db().collection<ISubscription>('rocketchat_subscription').insertMany(subscriptions.userSimple1Subscriptions)
        await connection.db().collection<ISubscription>('rocketchat_subscription').insertMany(subscriptions.userAdmin1Subscriptions)
    
        await connection.close()
    },

    async down() {
        const connection = await MongoClient.connect(URL_MONGODB);

        await connection.db().dropDatabase();
        await connection.close()
    }
}