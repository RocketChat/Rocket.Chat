"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultPermissions = exports.AppPermissions = void 0;
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
exports.AppPermissions = {
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
        read: { name: 'server-setting.read' },
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
        'workspace-token': { name: 'cloud.workspace-token', scopes: [] },
    },
    // Internal permissions
    scheduler: {
        default: { name: 'scheduler' },
    },
    networking: {
        default: { name: 'networking', domains: [] },
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
exports.defaultPermissions = [
    exports.AppPermissions.user.read,
    exports.AppPermissions.user.write,
    exports.AppPermissions.upload.read,
    exports.AppPermissions.upload.write,
    exports.AppPermissions.ui.interaction,
    exports.AppPermissions.setting.read,
    exports.AppPermissions.setting.write,
    exports.AppPermissions.room.read,
    exports.AppPermissions.room.write,
    exports.AppPermissions.message.read,
    exports.AppPermissions.message.write,
    exports.AppPermissions['livechat-department'].read,
    exports.AppPermissions['livechat-department'].write,
    exports.AppPermissions['livechat-room'].read,
    exports.AppPermissions['livechat-room'].write,
    exports.AppPermissions['livechat-message'].read,
    exports.AppPermissions['livechat-message'].write,
    exports.AppPermissions['livechat-visitor'].read,
    exports.AppPermissions['livechat-visitor'].write,
    exports.AppPermissions['livechat-status'].read,
    exports.AppPermissions['livechat-custom-fields'].write,
    exports.AppPermissions.scheduler.default,
    exports.AppPermissions.networking.default,
    exports.AppPermissions.persistence.default,
    exports.AppPermissions.env.read,
    exports.AppPermissions.command.default,
    exports.AppPermissions.videoConference.provider,
    exports.AppPermissions.videoConference.read,
    exports.AppPermissions.videoConference.write,
    exports.AppPermissions.apis.default,
];
//# sourceMappingURL=AppPermissions.js.map