@0xbbbe049af795122e;

using Spk = import "/sandstorm/package.capnp";
# This imports:
#   $SANDSTORM_HOME/latest/usr/include/sandstorm/package.capnp
# Check out that file to see the full, documented package definition format.

const pkgdef :Spk.PackageDefinition = (
	# The package definition. Note that the spk tool looks specifically for the
	# "pkgdef" constant.

	id = "vfnwptfn02ty21w715snyyczw0nqxkv3jvawcah10c6z7hj1hnu0",
	# Your app ID is actually its public key. The private key was placed in
	# your keyring. All updates must be signed with the same key.

	manifest = (
		# This manifest is included in your app package to tell Sandstorm
		# about your app.

		appTitle = (defaultText = "Rocket.Chat"),

		appVersion = 62,  # Increment this for every release.

		appMarketingVersion = (defaultText = "0.63.3"),
		# Human-readable representation of appVersion. Should match the way you
		# identify versions of your app in documentation and marketing.

		actions = [
			# Define your "new document" handlers here.
			( title = (defaultText = "New Rocket.Chat"),
				command = .myCommand
				# The command to run when starting for the first time. (".myCommand"
				# is just a constant defined at the bottom of the file.)
			)
		],

		continueCommand = .myCommand,
		# This is the command called to start your app back up after it has been
		# shut down for inactivity. Here we're using the same command as for
		# starting a new instance, but you could use different commands for each
		# case.

		metadata = (
			icons = (
				appGrid = (svg = embed "rocket.chat-128.svg"),
				grain = (svg = embed "rocket.chat-24.svg"),
				market = (svg = embed "rocket.chat-150.svg"),
			),

			website = "https://rocket.chat",
			codeUrl = "https://github.com/RocketChat/Rocket.Chat",
			license = (openSource = mit),
			categories = [communications, productivity, office, social, developerTools],

			author = (
				contactEmail = "team@rocket.chat",
				pgpSignature = embed "pgp-signature",
				upstreamAuthor = "Rocket.Chat",
			),
			pgpKeyring = embed "pgp-keyring",

			description = (defaultText = embed "description.md"),
			shortDescription = (defaultText = "Chat app"),

			screenshots = [
				(width = 1024, height = 696, png = embed "screenshot1.png"),
				(width = 1024, height = 696, png = embed "screenshot2.png"),
				(width = 1024, height = 696, png = embed "screenshot3.png"),
				(width = 1024, height = 696, png = embed "screenshot4.png")
			],

			changeLog = (defaultText = embed "CHANGELOG.md"),
		),

	),

	sourceMap = (
		# The following directories will be copied into your package.
		searchPath = [
			( sourcePath = "/home/vagrant/bundle" ),
			( sourcePath = "/opt/meteor-spk/meteor-spk.deps" )
		]
	),

	alwaysInclude = [ "." ],
	# This says that we always want to include all files from the source map.
	# (An alternative is to automatically detect dependencies by watching what
	# the app opens while running in dev mode. To see what that looks like,
	# run `spk init` without the -A option.)

	bridgeConfig = (
		viewInfo = (
			eventTypes = [
				(name = "message", verbPhrase = (defaultText = "sent message")),
				(name = "privateMessage", verbPhrase = (defaultText = "sent private message"), requiredPermission = (explicitList = void)),
			]
		),
		saveIdentityCaps = true,
	),
);

const myCommand :Spk.Manifest.Command = (
	# Here we define the command used to start up your server.
	argv = ["/sandstorm-http-bridge", "8000", "--", "/opt/app/.sandstorm/launcher.sh"],
	environ = [
		# Note that this defines the *entire* environment seen by your app.
		(key = "PATH", value = "/usr/local/bin:/usr/bin:/bin"),
		(key = "SANDSTORM", value = "1"),
		(key = "HOME", value = "/var"),
		(key = "Statistics_reporting", value = "false"),
		(key = "Accounts_AllowUserAvatarChange", value = "false"),
		(key = "Accounts_AllowUserProfileChange", value = "false"),
		(key = "BABEL_CACHE_DIR", value = "/var/babel_cache")
	]
);
