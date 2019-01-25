import { hasAllPermission, hasAtLeastOnePermission, hasRole } from 'meteor/rocketchat:authorization';

RocketChat.authz.hasAllPermission = hasAllPermission;
RocketChat.authz.hasPermission = RocketChat.authz.hasAllPermission;
RocketChat.authz.hasAtLeastOnePermission = hasAtLeastOnePermission;
RocketChat.authz.hasRole = hasRole;
