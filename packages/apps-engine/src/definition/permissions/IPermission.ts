export interface IPermission {
    name: string;
    required?: boolean;
}

export interface INetworkingPermission extends IPermission {
    domains: Array<string>;
}

export interface IWorkspaceTokenPermission extends IPermission {
    scopes: Array<string>;
}

export interface IReadSettingPermission extends IPermission {
    hiddenSettings: Array<string>;
}
