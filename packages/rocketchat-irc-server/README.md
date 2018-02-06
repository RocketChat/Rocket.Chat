**IRC Server Federation**

Provides an IRC Network environmet (using Docker) linking servers

```
docker pull inspircd/inspircd-docker
docker run --name ircd -p 6667:6667 -p 7000:7000 -e "INSP_NET_SUFFIX=.example.com" -e "INSP_NET_NAME=LocalNetwork" -e "INSP_SERVER_NAME=irc.example.com" -e "INSP_ENABLE_DNSBL=no" -e "INSP_LINK1_NAME=irc.example.com" -e "INSP_LINK1_IPADDR=0.0.0.0" -e "INSP_LINK1_PORT=7000" -e "INSP_LINK1_SENDPASS=password" -e "INSP_LINK1_RECVPASS=password" -e "INSP_LINK1_TLS_ON=no" inspircd/inspircd-docker
```

For start or stop your network do it
```
docker start|stop ircd
```

Add settings for your IRC Network on central admin at Rocket.Chat instance.
Connect your IRC client (e.g mIRC, irssi etc) using the port 6667 and connect your Rocket.Chat instance at port 7000.

Read more in [official InspIRCd image page at Docker Hub](https://hub.docker.com/r/inspircd/inspircd-docker).
