import type { Emitter } from '@rocket.chat/emitter';
export type DefaultServiceStateMap = Record<string, string>;
export type ServiceStateEvent<ServiceStateMap extends DefaultServiceStateMap, K extends keyof ServiceStateMap = keyof ServiceStateMap> = {
    [P in keyof ServiceStateMap]: ServiceStateMap[P] extends infer U ? {
        stateName: P;
        stateValue: U;
    } : {
        stateName: P;
        stateValue: string;
    };
}[K];
export type ServiceStateValue<ServiceStateMap extends DefaultServiceStateMap, K extends keyof ServiceStateMap> = ServiceStateEvent<ServiceStateMap, K>['stateValue'];
export type ServiceProcessorEvents<ServiceStateMap extends DefaultServiceStateMap> = {
    stateChange: string;
    internalStateChange: keyof ServiceStateMap;
    internalError: {
        critical: boolean;
        error: string | Error;
    };
};
export interface IServiceProcessor<ServiceStateMap extends DefaultServiceStateMap = DefaultServiceStateMap> {
    emitter: Emitter<ServiceProcessorEvents<ServiceStateMap>>;
    getInternalState<K extends keyof ServiceStateMap>(stateName: K): ServiceStateValue<ServiceStateMap, K>;
}
//# sourceMappingURL=IServiceProcessor.d.ts.map