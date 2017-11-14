Meteor.methods({
  createSubGroup: function(groupName, groupTopic, groupDescription, roomId, user) {

    let username = user.username;
    let currentRoom = RocketChat.models.Rooms.findOneById(roomId);
    let currentName = currentRoom.name;
    let currentSub = RocketChat.models.Subscriptions.findOne({'rid': roomId, 'u.username': username});
    let nameValidation;

    try {
      nameValidation = new RegExp('^' + RocketChat.settings.get('UTF8_Names_Validation') + '$');
    } catch (error) {
      nameValidation = new RegExp('^[0-9a-zA-Z-_.]+$');
    }

    if (!nameValidation.test(groupName)) {
      throw new Meteor.Error('error-invalid-name', 'Invalid name', { function: 'Meteor.createSubGroup' });
    }

    if (!currentRoom || !currentSub) {
      throw new Meteor.Error('error-subgroup-must-join-group-first', 'Must join a channel before creating a subgroup', { function: 'createSubGroup' });
    }

    if (currentSub.subGroup) {
      throw new Meteor.Error('error-subgroup-no-nested-subgroups', 'You cannot create a subgroup of a subgroup', { function: 'createSubGroup' });
    }

    let newName = `${currentName}_${groupName}`
    let newRoom = RocketChat.createRoom('p', newName, username, [username]);

    // update new room
    RocketChat.models.Rooms.update({
      '_id': newRoom.rid
    }, {
      $set: {
        'subGroup': true,
        'topic': groupTopic,
        'description': groupDescription,
        'subGroupName': groupName,
        'originalRoomId': roomId
      }
    });

    // update the owner's subscriptions
    RocketChat.models.Subscriptions.update({
      'rid': newRoom.rid
    }, {
      $set: {
        'subGroup': true,
        'subGroupName': groupName,
        'originalRoomId': roomId
      }
    });

    return RocketChat.models.Rooms.findOne({'_id': newRoom.rid}).name;
  }
});
