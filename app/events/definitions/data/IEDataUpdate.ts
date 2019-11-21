import { EDataDefinition } from '../IEvent';

export interface IEDataUpdate<T extends EDataDefinition> {
    set?: T;
    unset?: T;
}
