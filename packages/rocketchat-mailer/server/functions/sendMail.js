/*globals Mailer */
Mailer.sendMail = function(from, subject, body, dryrun, query) {

	const rfcMailPatternWithName = /^(?:.*<)?([a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*)(?:>?)$/;
	if (!rfcMailPatternWithName.test(from)) {
		throw new Meteor.Error('error-invalid-from-address', 'Invalid from address', {
			'function': 'Mailer.sendMail'
		});
	}
	if (body.indexOf('[unsubscribe]') === -1) {
		throw new Meteor.Error('error-missing-unsubscribe-link', 'You must provide the [unsubscribe] link.', {
			'function': 'Mailer.sendMail'
		});
	}
	const header = RocketChat.placeholders.replace(RocketChat.settings.get('Email_Header') || '');
	const footer = RocketChat.placeholders.replace(RocketChat.settings.get('Email_Footer') || '');

	let userQuery = { 'mailer.unsubscribed': { $exists: 0 } };
	if (query) {
		userQuery = { $and: [ userQuery, EJSON.parse(query) ] };
	}

	if (dryrun) {
		return Meteor.users.find({
			'emails.address': from
		}).forEach((user) => {
			let email = undefined;
			if (user.emails && user.emails[0] && user.emails[0].address) {
				email = user.emails[0].address;
			}
			const html = RocketChat.placeholders.replace(body, {
				unsubscribe: Meteor.absoluteUrl(FlowRouter.path('mailer/unsubscribe/:_id/:createdAt', {
					_id: user._id,
					createdAt: user.createdAt.getTime()
				})),
				name: user.name,
				email
			});
			email = `${ user.name } <${ email }>`;
			if (rfcMailPatternWithName.test(email)) {
				Meteor.defer(function() {
					return Email.send({
						to: email,
						from,
						subject,
						html: header + html + footer
					});
				});
				return console.log(`Sending email to ${ email }`);
			}
		});
	} else {
		return Meteor.users.find(userQuery).forEach(function(user) {
			let email = undefined;
			if (user.emails && user.emails[0] && user.emails[0].address) {
				email = user.emails[0].address;
			}
			const html = RocketChat.placeholders.replace(body, {
				unsubscribe: Meteor.absoluteUrl(FlowRouter.path('mailer/unsubscribe/:_id/:createdAt', {
					_id: user._id,
					createdAt: user.createdAt.getTime()
				})),
				name: user.name,
				email
			});
			email = `${ user.name } <${ email }>`;
			if (rfcMailPatternWithName.test(email)) {
				Meteor.defer(function() {
					return Email.send({
						to: email,
						from,
						subject,
						html: header + html + footer
					});
				});
				return console.log(`Sending email to ${ email }`);
			}
		});
	}
};
