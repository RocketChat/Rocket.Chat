import type { IOmnichannelSource, OmnichannelSourceType } from './ILivechatRoom';
import type { IVisitorEmail } from './IVisitorEmail';
import type { IVisitorPhone } from './IVisitorPhone';

export interface ILivechatContactVisitorAssociation {
    visitorId: string;
    source: {
        type: OmnichannelSourceType;
        id?: IOmnichannelSource['id'];
    };
}

export interface ILivechatContactChannel {
    name: string;
    verified: boolean;
    visitor: ILivechatContactVisitorAssociation;
    blocked: boolean;
    field?: string;
    value?: string;
    verifiedAt?: Date;
    details: IOmnichannelSource;
    lastChat?: {
        _id: string;
        ts: Date;
    };
}

export interface ILivechatContactConflictingField {
    field: 'name' | 'manager' | `customFields.${string}`;
    value: string;
}

export interface ILivechatContact {
    _id: string;
    _updatedAt: Date;
    name: string;
    phones?: IVisitorPhone[];
    emails?: IVisitorEmail[];
    contactManager?: string;
    unknown?: boolean;
    conflictingFields?: ILivechatContactConflictingField[];
    customFields?: Record<string, string | unknown>;
    channels: ILivechatContactChannel[];
    createdAt: Date;
    lastChat?: {
        _id: string;
        ts: Date;
    };
    importIds?: string[];
}
