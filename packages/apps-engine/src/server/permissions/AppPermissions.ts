import type { INetworkingPermission, IPermission, IReadSettingPermission, IWorkspaceTokenPermission } from '../../definition/permissions/IPermission';

/**
 * @description
 *
 * App Permission naming rules:
 *
 * 'scope-name': {
 *    'permission-name': { name: 'scope-name.permission-name' }
 * }
 *
 * You can retrive this permission by using:
 * AppPermissions['scope-name']['permission-name'] -> { name: 'scope-name.permission-name' }
 *
 * @example
 *
 * AppPermissions.upload.read // { name: 'upload.read', domains: [] }
 */
export const AppPermissions = {
    user: {
        read: { name: 'user.read' },
        write: { name: 'user.write' },
    },
    upload: {
        read: { name: 'upload.read' },
        write: { name: 'upload.write' },
    },
    email: {
        send: { name: 'email.send' },
    },
    ui: {
        interaction: { name: 'ui.interact' },
        registerButtons: { name: 'ui.registerButtons' },
    },
    setting: {
        read: { name: 'server-setting.read', hiddenSettings: [] } as IReadSettingPermission,
        write: { name: 'server-setting.write' },
    },
    room: {
        read: { name: 'room.read' },
        write: { name: 'room.write' },
    },
    role: {
        read: { name: 'role.read' },
        write: { name: 'role.write' },
    },
    message: {
        read: { name: 'message.read' },
        write: { name: 'message.write' },
    },
    moderation: {
        read: { name: 'moderation.read' },
        write: { name: 'moderation.write' },
    },
    contact: {
        read: { name: 'contact.read' },
        write: { name: 'contact.write' },
    },
    threads: {
        read: { name: 'threads.read' },
    },
    'livechat-status': {
        read: { name: 'livechat-status.read' },
    },
    'livechat-custom-fields': {
        write: { name: 'livechat-custom-fields.write' },
    },
    'livechat-visitor': {
        read: { name: 'livechat-visitor.read' },
        write: { name: 'livechat-visitor.write' },
    },
    'livechat-message': {
        read: { name: 'livechat-message.read' },
        write: { name: 'livechat-message.write' },
        multiple: { name: 'livechat-message.multiple' },
    },
    'livechat-room': {
        read: { name: 'livechat-room.read' },
        write: { name: 'livechat-room.write' },
    },
    'livechat-department': {
        read: { name: 'livechat-department.read' },
        write: { name: 'livechat-department.write' },
        multiple: { name: 'livechat-department.multiple' },
    },
    env: {
        read: { name: 'env.read' },
    },
    cloud: {
        'workspace-token': { name: 'cloud.workspace-token', scopes: [] } as IWorkspaceTokenPermission,
    },
    // Internal permissions
    scheduler: {
        default: { name: 'scheduler' },
    },
    networking: {
        default: { name: 'networking', domains: [] } as INetworkingPermission,
    },
    persistence: {
        default: { name: 'persistence' },
    },
    command: {
        default: { name: 'slashcommand' },
    },
    videoConference: {
        read: { name: 'video-conference.read' },
        write: { name: 'video-conference.write' },
        provider: { name: 'video-conference-provider' },
    },
    apis: {
        default: { name: 'api' },
    },
    'oauth-app': {
        read: { name: 'oauth-app.read' },
        write: { name: 'oauth-app.write' },
    },
};

/**
 * @description
 * Default permissions for apps
 * Used to ensure backward compatibility with apps
 * that were developed before the permission system was introduced.
 */
export const defaultPermissions: Array<IPermission> = [
    AppPermissions.user.read,
    AppPermissions.user.write,
    AppPermissions.upload.read,
    AppPermissions.upload.write,
    AppPermissions.ui.interaction,
    AppPermissions.setting.read,
    AppPermissions.setting.write,
    AppPermissions.room.read,
    AppPermissions.room.write,
    AppPermissions.message.read,
    AppPermissions.message.write,
    AppPermissions['livechat-department'].read,
    AppPermissions['livechat-department'].write,
    AppPermissions['livechat-room'].read,
    AppPermissions['livechat-room'].write,
    AppPermissions['livechat-message'].read,
    AppPermissions['livechat-message'].write,
    AppPermissions['livechat-visitor'].read,
    AppPermissions['livechat-visitor'].write,
    AppPermissions['livechat-status'].read,
    AppPermissions['livechat-custom-fields'].write,
    AppPermissions.scheduler.default,
    AppPermissions.networking.default,
    AppPermissions.persistence.default,
    AppPermissions.env.read,
    AppPermissions.command.default,
    AppPermissions.videoConference.provider,
    AppPermissions.videoConference.read,
    AppPermissions.videoConference.write,
    AppPermissions.apis.default,
];
