import { Meteor } from 'meteor/meteor';

Meteor.methods({
	checkUserHasPassword() {
		if (!Meteor.userId()) {
			throw new Meteor.Error('not-authorized');
		}

		const user = Meteor.user();

		return { result: !!user?.services?.password?.bcrypt?.trim() };
	},
});
