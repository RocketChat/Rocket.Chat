import type { OmnichannelSource } from './ILivechatRoom';
import type { IVisitorEmail } from './IVisitorEmail';
import type { IVisitorPhone } from './IVisitorPhone';

export interface ILivechatContactChannel {
    name: string;
    verified: boolean;
    visitorId: string;
    blocked: boolean;
    field?: string;
    value?: string;
    verifiedAt?: Date;
    details?: OmnichannelSource;
}

export interface ILivechatContactConflictingField {
    field: 'name' | 'manager' | `customFields.${string}`;
    value: string;
}

export interface ILivechatContact {
    _id: string;
    name: string;
    phones?: IVisitorPhone[];
    emails?: IVisitorEmail[];
    contactManager?: string;
    unknown?: boolean;
    hasConflict?: boolean;
    conflictingFields?: ILivechatContactConflictingField[];
    customFields?: Record<string, string | unknown>;
    channels?: ILivechatContactChannel[];
    createdAt: Date;
    lastChat?: {
        _id: string;
        ts: Date;
    };
}
