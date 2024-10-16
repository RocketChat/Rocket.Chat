export enum OmnichannelSourceType {
    WIDGET = 'widget',
    EMAIL = 'email',
    SMS = 'sms',
    APP = 'app',
    API = 'api',
    OTHER = 'other', // catch-all source type
}

export interface IOmnichannelSource {
    // TODO: looks like this is not so required as the definition suggests
    // The source, or client, which created the Omnichannel room
    type: OmnichannelSourceType;
    // An optional identification of external sources, such as an App
    id?: string;
    // A human readable alias that goes with the ID, for post analytical purposes
    alias?: string;
    // A label to be shown in the room info
    label?: string;
    // The sidebar icon
    sidebarIcon?: string;
    // The default sidebar icon
    defaultIcon?: string;
    // The destination of the message (e.g widget host, email address, whatsapp number, etc)
    destination?: string;
}
