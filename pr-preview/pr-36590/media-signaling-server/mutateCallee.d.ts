import type { CallActorType } from '@rocket.chat/media-signaling';
export declare function mutateCallee(callee: {
    type: CallActorType;
    id: string;
}): Promise<{
    type: CallActorType;
    id: string;
}>;
