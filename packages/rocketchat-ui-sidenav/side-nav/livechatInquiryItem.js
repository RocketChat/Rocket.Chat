Template.livechatInquiryItem.helpers({
    alert: function() {
        if (FlowRouter.getParam('_id') !== this.rid || !document.hasFocus()) {
            return this.alert;
        }
    },
    unread: function() {
        return 1;
        if ((FlowRouter.getParam('_id') !== this.rid || !document.hasFocus()) && this.unread > 0) {
            return this.unread;
        }
    },
    userStatus: function() {
        return 'status-' + (Session.get('user_' + this.name + '_status') || 'offline');
    },
    name: function() {
        return this.name;
    },
    roomIcon: function() {
        return RocketChat.roomTypes.getIcon(this.t);
    },
    active: function() {
        if (Session.get('openedRoom') === this.rid) {
            return 'active';
        }
    },
    route: function() {
        return RocketChat.roomTypes.getRouteLink(this.t, this);
    }
});

Template.livechatInquiryItem.rendered = function() {
    if (!((FlowRouter.getParam('_id') != null) && FlowRouter.getParam('_id') === this.data.rid) && !this.data.ls && this.data.alert === true) {
        return KonchatNotification.newRoom(this.data.rid);
    }
};

Template.livechatInquiryItem.events({
    'click .open-room': function(e) {
        e.stopPropagation();
        e.preventDefault();

        var inquiry = this;

        console.log(inquiry.message);

        swal({
            title: 'Do you want to take this client?',
            text: 'message: ' + inquiry.message,
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Take it!'
        }, function (isConfirm) {
            if (isConfirm) {
                // make server call 
                console.log(inquiry);
                Meteor.call('livechat:takeInquiry', inquiry, Meteor.user());
            }
        });
    }
});

