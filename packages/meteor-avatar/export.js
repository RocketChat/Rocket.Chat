// Avatar object to be exported
Avatar = {

  // If defined (e.g. from a startup config file in your app), these options
  // override default functionality
  options: {

    // Determines the type of fallback to use when no image can be found via
    // linked services (Gravatar included):
    //   "default image" (the default option, which will show either the image
    //   specified by defaultImageUrl, the package's default image, or a Gravatar
    //   default image)
    //     OR
    //   "initials" (show the user's initials).
    fallbackType: '',

    // This will replace the included default avatar image's URL
    // ('packages/bengott_avatar/default.png'). It can be a relative path
    // (relative to website's base URL, e.g. 'images/defaultAvatar.png').
    defaultImageUrl: '',
    
    // This property name will be used to fetch an avatar url from the user's profile
    // (e.g. 'avatar'). If this property is set and a property of that name exists
    // on the user's profile (e.g. user.profile.avatar) that property will be used
    // as the avatar url.
    customImageProperty: '',
    
    // Gravatar default option to use (overrides default image URL)
    // Options are available at:
    // https://secure.gravatar.com/site/implement/images/#default-image
    gravatarDefault: '',

    // This property on the user object will be used for retrieving gravatars
    // (useful when user emails are not published).
    emailHashProperty: ''
  },

  // Get the initials of the user
  getInitials: function (user) {

    var initials = '';
    var name = '';
    var parts = [];

    if (user && user.profile && user.profile.firstName) {
      initials = user.profile.firstName.charAt(0).toUpperCase();

      if (user.profile.lastName) {
        initials += user.profile.lastName.charAt(0).toUpperCase();
      }
      else if (user.profile.familyName) {
        initials += user.profile.familyName.charAt(0).toUpperCase();
      }
      else if (user.profile.secondName) {
        initials += user.profile.secondName.charAt(0).toUpperCase();
      }
    }
    else {
      if (user && user.profile && user.profile.name) {
        name = user.profile.name;
      }
      else if (user && user.username) {
        name = user.username;
      }

      parts = name.split(' ');
      // Limit getInitials to first and last initial to avoid problems with
      // very long multi-part names (e.g. "Jose Manuel Garcia Galvez")
      initials = _.first(parts).charAt(0).toUpperCase();
      if (parts.length > 1) {
        initials += _.last(parts).charAt(0).toUpperCase();
      }
    }

    return initials;
  },

  // Get the url of the user's avatar
  getUrl: function (user) {

    var url = '';
    var defaultUrl, svc;

    if (user) {
      svc = getService(user);
      if (svc === 'twitter') {
        // use larger image (200x200 is smallest custom option)
        url = user.services.twitter.profile_image_url_https.replace('_normal.', '_200x200.');
      }
      else if (svc === 'facebook') {
        // use larger image (~200x200)
        url = 'https://graph.facebook.com/' + user.services.facebook.id + '/picture?type=large';
      }
      else if (svc === 'google') {
        url = user.services.google.picture;
      }
      else if (svc === 'github') {
        url = 'https://avatars.githubusercontent.com/' + user.services.github.username + '?s=200';
      }
      else if (svc === 'instagram') {
        url = user.services.instagram.profile_picture;
      }
      else if (svc === "custom") {
        url = getDescendantProp(user, Avatar.options.customImageProperty);
      }
      else if (svc === 'none') {
        defaultUrl = Avatar.options.defaultImageUrl || 'packages/bengott_avatar/default.png';
        // If it's a relative path (no '//' anywhere), complete the URL
        if (defaultUrl.indexOf('//') === -1) {
          // Strip starting slash if it exists
          if (defaultUrl.charAt(0) === '/') defaultUrl = defaultUrl.slice(1);
          // Then add the relative path to the server's base URL
          defaultUrl = Meteor.absoluteUrl() + defaultUrl;
        }
        url = getGravatarUrl(user, defaultUrl);
      }
    }

    return url;
  }
};
