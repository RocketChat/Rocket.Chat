import { SMTPServer } from 'smtp-server';

import { simpleParser } from 'mailparser';

(async function() {
	if (!process.env.MONGO_URL) {
		console.error("MONGO_URL must be set");
		process.exit(1);
	}

	const { Emails } = await import("./model");

	const server = new SMTPServer({
		secure: false,
		name: 'ci',
		authOptional: true,
		allowInsecureAuth: true,

		async onData(stream, session, callback) {
			stream.on('end', callback);

			await Emails.createNewEmail(await simpleParser(stream));
		},
	});

	server.listen(parseInt(String(process.env.SMTP_PORT) || "2525", 10), () => console.log("SMTP server started ..."));
})();


