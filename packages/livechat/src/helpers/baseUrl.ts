import { Livechat } from '../api';

export const getConnectionBaseUrl = () => `http${Livechat.connection.ssl ? 's' : ''}://${Livechat.connection.url}`;

export const getAvatarUrl = (username: string) => (username ? `${getConnectionBaseUrl()}/avatar/${username}` : null);

export const getAttachmentUrl = (url: string) => new URL(url, getConnectionBaseUrl()).toString();
