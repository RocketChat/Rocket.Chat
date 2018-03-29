![Rocket.Chat logo](https://rocket.chat/images/logo/logo-dark.svg?v3)

# rocketchat-server snap for Ubuntu Core  (all arch)

Features:
* bundles ubuntu distribution specific and RC compatible mongodb version
* oplog tailing for mongo by default
* mongodb backup command  
* mongodb restore command
* caddy reverse proxy built-in - capable of handling free lestencrypt ssl

Note:

Currently, this repository is mirrored on launchpad, and used to build latest ARMHF and i386 snaps.   

You can download recent builds here:
https://code.launchpad.net/~sing-li/+snap/rocketchat-server

Due an issue with the existing installed base of amd64 users (existing snap always installed mongodb 3.2  [#issue](https://github.com/RocketChat/rocketchat-server-snap/issues/3)), this snap is not currently used for amd64 builds.

### Test installation 

Download the latest snap file of the corresponding architecture to your Ubuntu Core 16 or 16.04LTS server.

`sudo snap install ./rocketchat-server-xxxxxxxx.snap  --dangerous`


### Development or compile your own snap

Make sure you have `snapcraft` installed.

```
git clone https://github.com/RocketChat/rocketchat-server-snap
cd rocketchat-server-snap
snapcraft snap
```

### Regression tests (run for amd64, i386 and armhf):
- snapcraft runs properly
- snap installs properly
- all services start automatically
- rc service shows a 5-second restart delay while waiting for mongo
	- to test manually, stop rc, stop mongo, start rc, wait 20s or so, start mongo
- rc can be successfully restarted via the "Restart the server" button under Admin > Settings > General
- rc service shows a 5-second delay when restarted via this button
- all commands execute successfully:
	- initcaddy
		- modify the Caddyfile to test:
			- self-signed TLS certificate (use the "tls self_signed" caddy directive)
			- changing ports (with and without TLS)
			- using IP address (only works without TLS)
			- successfully acquiring a Let's Encrypt certificate (requires a registered domain)
	- backupdb
		- should run only with sudo
	- restoredb
		- ideally, stop rc service prior to running this (mongo must be running)
		- should run only with sudo
		- use any file outside of $snap_common (should fail)
		- use the file created with backupdb
		- use a dummy .tgz file without actual data
			- with and without a "parties" directory in the archive
