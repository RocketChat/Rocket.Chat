import type { IApiExample } from './IApiExample';

export interface IApiEndpointMetadata {
    path: string;
    computedPath: string;
    methods: Array<string>;
    examples?: {
        [key: string]: IApiExample;
    };
}
