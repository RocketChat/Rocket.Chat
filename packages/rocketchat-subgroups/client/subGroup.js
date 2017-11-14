import toastr from 'toastr';

Template.subGroups.events({
  'click .create-group': function() {
    
    let groupName = $('#group-name').val().trim();
    let groupTopic = $('#topic').val().trim();
    let groupDescription = $('#description').val().trim();
    
    if (groupName.length === 0) {
      return toastr.warning("Please enter a subgroup name");
    } else {
      Meteor.call('createSubGroup', groupName, groupTopic, groupDescription, Session.get('openedRoom'), Meteor.user(), (err, resp) => {
        if (!err) {
          $('#group-name').val('');
          $('#topic').val('');
          $('#description').val('');
          toastr.success("Subgroup Created!");
          return FlowRouter.go("/group/" + resp + "/");
        } else {
          if (err.error === 'error-duplicate-channel-name') {
            return toastr.warning("This group name already exists");
          } else if (err.error === 'error-subgroup-must-join-group-first') {
            return toastr.warning("You must join this channel first");
          } else if (err.error === 'error-subgroup-no-nested-subgroups') {
            return toastr.warning("You cannot create a group from a group");
          } else if (err.error === 'error-invalid-name') {
            return toastr.warning("Group names can only contain letters, numbers, hyphens, and underscores (no spaces)");
          } else {
            return toastr.error("Something went wrong");
          }
        }
      });
    }
  }
});