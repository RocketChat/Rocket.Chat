Meteor.methods({
  deleteCustomUserStatus(userStatusID) {
    let userStatus = null;

    if (RocketChat.authz.hasPermission(this.userId, 'manage-user-status')) {
      userStatus = RocketChat.models.CustomUserStatus.findOneByID(userStatusID);
    } else {
      throw new Meteor.Error('not_authorized');
    }

    if (userStatus == null) {
      throw new Meteor.Error('Custom_User_Status_Error_Invalid_User_Status', 'Invalid user status', { method: 'deleteCustomUserStatus' });
    }

    RocketChat.models.CustomUserStatus.removeByID(userStatusID);
    RocketChat.Notifications.notifyLogged('deleteCustomUserStatus', {userStatusData: userStatus});

    return true;
  }
});
