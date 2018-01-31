**IRC Server Federation**

Provides an IRC Network environmet with Docker for tests.

```
docker pull inspircd/inspircd-docker
docker run --name ircd -p 6667:6667 -p 6697:6697 -p 7000:7000 -e "INSP_NET_SUFFIX=.rocket.chat" -e "INSP_NET_NAME=RocketChatNetwork" -e "INSP_SERVER_NAME=irc.rocket.chat" -e "INSP_SERVICES_PASSWORD=password" inspircd/inspircd-docker
```

You may also use a more simple container with services enabled

```
docker run --name ircd -p 6667:6667 -p 6697:6697 -p 7000:7000 -e "INSP_SERVICES_PASSWORD=password" inspircd/inspircd-docker
```

Add settings for your IRC Network on central admin at Rocket.Chat instance.

Read more in [official InspIRCd image page at Docker Hub](https://hub.docker.com/r/inspircd/inspircd-docker).
