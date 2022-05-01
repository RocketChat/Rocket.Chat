import type { Timestamp, UUID } from 'bson';

export enum OplogOperations {
    COMMAND = 'c',
    INSERT = 'i',
    UPDATE = 'u',
    DELETE = 'd',
    NOOP = 'n'
};

export type OplogOperationType = `${OplogOperations}`;

type RetryImage = 'preImage' | 'postImage';

// see OpTime::toBSON
interface OpTime {
    ts: Timestamp,
    t?: number;
};

export type Document = { _id: any } & { [k: string]: any };
export type OperationDetail = {
    $set?: { [k: string]: any };
    $unset?: { [k: string]: any };
};

interface OplogEntryBase {
    h?: string;
    v: number;
    wall: Date;
    fromMigrate?: boolean;
    fromTenantMigration?: UUID;
    _id?: any;
    stmtId?: number | number[];
    prevOpTime?: OpTime;
    postImageOpTime?: OpTime;
    needsRetryImage?: RetryImage;
};

export interface OplogEntry extends OplogEntryBase {
    op: OplogOperationType;
    ns: string;
    ui?: UUID;
    /**
     * if op === OplogOperations.INSERT; then o is the document 
     * if op === OplogOperations.UPDATE; then o has $set, $unset && o2 is the document
     */
    o: Document | OperationDetail;
    o2?: Document;
    b?: boolean;
    preImageOptime?: OpTime;
    ts: Timestamp;
    t: number;
    destinedRecipient?: string;
};