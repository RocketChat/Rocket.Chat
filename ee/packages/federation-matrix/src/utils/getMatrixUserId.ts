import { isUserNativeFederated } from '@rocket.chat/core-typings';


export const getMatrixUserId = (user: any, serverName: string): string => {
    if (isUserNativeFederated(user) && user.federated?.mui) {
        return user.federation.mui;
    }
    if (!user.username) {
        throw new Error("Username is required to build matrix user id");
    }

    return `@${user.username}:${serverName}`;
};