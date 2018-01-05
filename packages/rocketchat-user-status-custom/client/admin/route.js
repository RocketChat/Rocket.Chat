FlowRouter.route('/admin/user-status-custom', {
  name: 'user-status-custom',
  subscriptions(/*params, queryParams*/) {
    this.register('CustomUserStatus', Meteor.subscribe('CustomUserStatus'));
  },
  action(/*params*/) {
    BlazeLayout.render('main', {center: 'adminUserStatus'});
  }
});