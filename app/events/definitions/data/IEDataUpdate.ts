import { EDataDefinition } from '../IEvent';

export interface IEDataUpdate<T extends EDataDefinition> {
    [key: string]: T;
}
