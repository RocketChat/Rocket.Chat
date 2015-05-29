Template.avatar.helpers({

  size: function () {
    var valid = ['large', 'small', 'extra-small'];
    return _.contains(valid, this.size) ? 'avatar-' + this.size : '';
  },

  dimensions: function () {
    var value;
    if      (this.size === 'large')       value = 80;
    else if (this.size === 'small')       value = 30;
    else if (this.size === 'extra-small') value = 20;
    else                                  value = 50;

    return { width: value, height: value };
  },

  shape: function () {
    var valid = ['rounded', 'circle'];
    return _.contains(valid, this.shape) ? 'avatar-' + this.shape : '';
  },

  class: function () { return this.class; },

  imageUrl: function () {
    var user = this.user ? this.user : Meteor.users.findOne(this.userId);
    var url = Avatar.getUrl(user);
    if (url && url.trim() !== '' && Template.instance().firstNode) {
      var img = Template.instance().find('img');
      if (img.src !== url.trim()) {
        img.style.removeProperty('display');
      }
    }
    return url;
  },

  initialsCss: function () {
    var css = '';
    if (this.bgColor)  css += 'background-color: ' + this.bgColor + ';';
    if (this.txtColor) css += 'color: ' + this.txtColor + ';';
    return css;
  },

  initialsText: function () {
    var user = this.user ? this.user : Meteor.users.findOne(this.userId);
    return this.initials || Avatar.getInitials(user);
  }

});
