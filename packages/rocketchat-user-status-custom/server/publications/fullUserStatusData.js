import s from 'underscore.string';

Meteor.publish('fullUserStatusData', function(filter, limit) {
  if (!this.userId) {
    return this.ready();
  }

  const fields = {
    name: 1,
    statusType: 1
  };

  filter = s.trim(filter);

  const options = {
    fields,
    limit,
    sort: { name: 1 }
  };

  if (filter) {
    const filterReg = new RegExp(s.escapeRegExp(filter), 'i');
    return RocketChat.models.CustomUserStatus.findByName(filterReg, options);
  }

  return RocketChat.models.CustomUserStatus.find({}, options);
});
