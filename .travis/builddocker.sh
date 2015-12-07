if [ -z ${TRAVIS_TAG+x} ];
then "curl -H \"Content-Type: application/json\" --data \"{'source_type': 'Branch', 'source_name': \'$TRAVIS_BRANCH\', 'docker_tag': \'`cat ../../build/version.txt`\'}\" -X POST https://registry.hub.docker.com/u/rocketchat/rocket.chat/trigger/$PUSHTOKEN/";
else "curl -H \"Content-Type: application/json\" --data \"{'source_type': 'Tag', 'source_name': \'$TRAVIS_TAG\', 'docker_tag': \'`cat ../../build/version.txt`\'}\" -X POST https://registry.hub.docker.com/u/rocketchat/rocket.chat/trigger/$PUSHTOKEN/";
fi

