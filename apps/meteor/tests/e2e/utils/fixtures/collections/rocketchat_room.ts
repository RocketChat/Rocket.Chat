import type { IRoom } from '@rocket.chat/core-typings';

export const roomPrivate1: IRoom = {
    _id: 'room_private_1',
    name: 'room_private_1',
    fname: 'room_private_1',
    description: 'any_description',
    encrypted: false,
    t: 'p',
    msgs: 0,
    usersCount: 1,
    u: {
        _id: 'user_simple_1',
        username: 'user_simple_1',
    },
    ts: new Date(),
    ro: false,
    _updatedAt: new Date(),
    autoTranslateLanguage: '',
}

export const roomPublic1: IRoom = {
    _id: 'room_public_1',
    name: 'room_public_1',
    fname: 'room_public_1',
    description: 'any_description',
    encrypted: false,
    t: 'c',
    msgs: 0,
    usersCount: 1,
    u: {
        _id: 'user_simple_1',
        username: 'user_simple_1',
    },
    ts: new Date(),
    ro: false,
    _updatedAt: new Date(),
    autoTranslateLanguage: '',
}