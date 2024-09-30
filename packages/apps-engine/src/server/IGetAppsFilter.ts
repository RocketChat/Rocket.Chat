export interface IGetAppsFilter {
    ids?: Array<string>;
    name?: string | RegExp;
    enabled?: boolean;
    disabled?: boolean;
}
