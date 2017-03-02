/* globals Department, Livechat */

Template.switchDepartment.helpers({
  departments() {
    return Department.find({ showOnRegistration: true });
  },
  selectedDepartment() {
    return this._id === Livechat.department;
  }
});

Template.switchDepartment.events({
  'change .switch-department-select'(e, instance) {
    var departmentId = instance.$('select[name=department]').val();
    if (!departmentId) {
      var department = Department.findOne({ showOnRegistration: true });
      if (department) {
        departmentId = department._id;
      }
    }
    Livechat.department = departmentId;

    var guestData = {
      token: visitor.getToken(),
      department: departmentId
    };
    Meteor.call('livechat:setDepartmentForVisitor', guestData, (error) => {
      if (error) {
        return console.log('Error ->', error);
      }
      Livechat.showSwitchDepartmentForm = false;
      swal({
        title: t('Department_switched'),
        type: 'success',
        timer: 2000
      });
    });
  }
});
