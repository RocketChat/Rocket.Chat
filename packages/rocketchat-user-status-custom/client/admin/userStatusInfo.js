Template.userStatusInfo.helpers({
  name() {
    const userStatus = Template.instance().userStatus.get();
    return userStatus.name;
  },

  userStatus() {
    return Template.instance().userStatus.get();
  },

  editingUserStatus() {
    return Template.instance().editingUserStatus.get();
  },

  userStatusToEdit() {
    const instance = Template.instance();
    return {
      tabBar: this.tabBar,
      userStatus: instance.userStatus.get(),
      back(name) {
        instance.editingUserStatus.set();

        if (name != null) {
          const userStatus = instance.userStatus.get();
          if (userStatus != null && userStatus.name != null && userStatus.name !== name) {
            return instance.loadedName.set(name);
          }
        }
      }
    };
  }
});

Template.userStatusInfo.events({
  'click .thumb'(e) {
    $(e.currentTarget).toggleClass('bigger');
  },

  'click .delete'(e, instance) {
    e.stopPropagation();
    e.preventDefault();
    const userStatus = instance.userStatus.get();
    if (userStatus != null) {
      const _id = userStatus._id;
      modal.open({
        title: t('Are_you_sure'),
        text: t('Custom_User_Status_Delete_Warning'),
        type: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#DD6B55',
        confirmButtonText: t('Yes_delete_it'),
        cancelButtonText: t('Cancel'),
        closeOnConfirm: false,
        html: false
      }, function() {
        Meteor.call('deleteCustomUserStatus', _id, (error/*, result*/) => {
          if (error) {
            return handleError(error);
          } else {
            modal.open({
              title: t('Deleted'),
              text: t('Custom_User_Status_Has_Been_Deleted'),
              type: 'success',
              timer: 2000,
              showConfirmButton: false
            });

            instance.tabBar.close();
          }
        });
      });
    }
  },

  'click .edit-user-satus'(e, instance) {
    e.stopPropagation();
    e.preventDefault();

    instance.editingUserStatus.set(instance.userStatus.get()._id);
  }
});

Template.userStatusInfo.onCreated(function() {
  this.userStatus = new ReactiveVar();
  this.editingUserStatus = new ReactiveVar();
  this.loadedName = new ReactiveVar();
  this.tabBar = Template.currentData().tabBar;

  this.autorun(() => {
    const data = Template.currentData();
    if (data != null && data.clear != null) {
      this.clear = data.clear;
    }
  });

  this.autorun(() => {
    const data = Template.currentData();
    const userStatus = this.userStatus.get();
    if (userStatus != null && userStatus.name != null) {
      this.loadedName.set(userStatus.name);
    } else if (data != null && data.name != null) {
      this.loadedName.set(data.name);
    }
  });

  this.autorun(() => {
    const data = Template.currentData();
    this.userStatus.set(data);
  });
});
