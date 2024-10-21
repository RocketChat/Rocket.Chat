export interface IOAuthApp {
    id: string;
    name: string;
    active: boolean;
    clientId?: string;
    clientSecret?: string;
    redirectUri: string;
    createdAt?: string;
    updatedAt?: string;
    createdBy: { username: string; id: string };
}

export type IOAuthAppParams = Omit<IOAuthApp, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'appId'>;
