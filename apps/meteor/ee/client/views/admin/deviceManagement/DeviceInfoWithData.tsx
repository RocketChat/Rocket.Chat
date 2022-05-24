import React, { ReactElement } from 'react';
import DeviceInfoContextualBar from './DeviceInfoContextualBar';

const DeviceInfoWithData = ({ deviceId }: { deviceId?: string }): ReactElement => {

    const session = {
        "instanceId": "YTR4ZLWo3ma2wtndA",
        "sessionId": "NnucGfkdj8hAyjjLJ",
        "day": 28,
        "month": 4,
        "year": 2022,
        "userId": "knecaPPCoAKwS7L6Q",
        "device": {
            "type": "browser",
            "name": "Chrome",
            "longVersion": "101.0.4951.41",
            "os": {
                "name": "Linux",
                "version": "x86_64"
            },
            "version": "101.0.4951"
        },
        "host": "localhost:3000",
        "ip": "127.0.0.1",
        "mostImportantRole": "admin",
        "roles": [
            "user",
            "admin"
        ],
        "type": "computed-session",
        "_updatedAt": "2022-04-29T05:00:00.024Z",
        "createdAt": "2022-04-28T23:24:37.471Z",
        "loginAt": "2022-04-28T23:24:37.470Z",
        "_id": "NnucGfkdj8hAyjjLJ"
    };

    return (
        <DeviceInfoContextualBar {...session}/>
    );
};

export default DeviceInfoWithData;
