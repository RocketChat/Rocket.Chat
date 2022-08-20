ARG NODE_VERSION
ARG METEOR_VERSION
ARG LOCAL_USERNAME

FROM --platform=amd64 node:${NODE_VERSION}-bullseye-slim

ARG METEOR_VERSION
ARG LOCAL_USERNAME

# dependencies
RUN apt update && \
  apt install --no-install-recommends -y \
  curl \
  procps \
  fontconfig \
  g++ \
  sudo \
  git \
  build-essential \
  python3-minimal \
  python-is-python3 \
  ca-certificates 

RUN useradd -mG sudo -s /bin/bash ${LOCAL_USERNAME} && \
  echo "${LOCAL_USERNAME} ALL=(ALL) NOPASSWD: ALL" > /etc/sudoers.d/${LOCAL_USERNAME}

USER ${LOCAL_USERNAME}

RUN curl --retry 5 -C - -L https://install.meteor.com?release=${METEOR_VERSION} | sh

ENV PATH "/home/${LOCAL_USERNAME}/.meteor:$PATH"