Meteor.methods({
    'jitsi:generateAccessToken': () => {
        if (!Meteor.userId()) {
            throw new Meteor.Error('error-invalid-user', 'Invalid user', {method: 'jitsi:generateToken'});
        }
        // generate token logic ...
        return 'test';
    },
});
