#!/usr/bin/env bash

docker pull thomasroehl/smarti:redlink

#docker run -d --net=host thomasroehl/smarti:firsttry

docker build -t smarti-with-stanfordnlp -<EOF
FROM redlinkgmbh/smarti

USER root
ADD [\
    "https://repo1.maven.org/maven2/edu/stanford/nlp/stanford-corenlp/3.6.0/stanford-corenlp-3.6.0.jar", \
    "https://repo1.maven.org/maven2/edu/stanford/nlp/stanford-corenlp/3.6.0/stanford-corenlp-3.6.0-models-german.jar", \
    "/opt/ext/"]
RUN chmod -R a+r /opt/ext/
USER smarti
EOF

docker run -d --name smarti --net=host smarti-with-stanfordnlp  --security.password=admin

docker ps
