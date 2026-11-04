FROM mcr.microsoft.com/devcontainers/base:ubuntu

SHELL ["/bin/bash", "-o", "pipefail", "-c"]

COPY package.json /tmp/package.json
COPY apps/meteor/.meteor/release /tmp/meteor-release

RUN apt-get update && apt-get install -y \
    apt-transport-https \
    build-essential \
    ca-certificates \
    curl \
    git \
    jq \
    libssl-dev \
    python3 \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Install the exact Node.js version required by Rocket.Chat
ENV NVM_DIR=/usr/local/nvm

RUN mkdir -p "$NVM_DIR" && \
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash && \
    source "$NVM_DIR/nvm.sh" && \
    NODE_VERSION=$(jq -r '.volta.node' /tmp/package.json) && \
    nvm install "$NODE_VERSION" && \
    nvm alias default "$NODE_VERSION"

ENV PATH="/usr/local/nvm/versions/node/v24.15.0/bin:${PATH}"

# Install the required Yarn version
RUN npm install -g corepack@latest && \
    corepack enable && \
    corepack prepare yarn@4.18.1 --activate

# Install the exact Meteor version required by Rocket.Chat
ENV METEOR_INSTALL=/usr/local/meteor

RUN curl "https://install.meteor.com/?release=$(cat /tmp/meteor-release)" | sh && \
    mv /root/.meteor "$METEOR_INSTALL"

ENV PATH="${METEOR_INSTALL}/bin:${PATH}"

CMD ["bash"]
