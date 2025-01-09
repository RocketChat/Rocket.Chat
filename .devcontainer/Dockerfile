# Use a base image with Ubuntu
FROM mcr.microsoft.com/vscode/devcontainers/base:ubuntu

# Copy package.json to the container
COPY package.json /tmp/package.json

# Install necessary packages
RUN apt-get update && apt-get install -y \
    apt-transport-https \
    build-essential \
    ca-certificates \
    curl \
    git \
    jq \
    libssl-dev && \
    rm -rf /var/lib/apt/lists/*

# Extract Node.js version from package.json
RUN NODE_VERSION=$(jq -r '.engines.node' /tmp/package.json) && \
    echo "Node version from package.json: $NODE_VERSION"

# Install Node.js and npm
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
    apt-get install -y nodejs

# Install Deno
RUN curl -fsSL https://deno.land/install.sh | sh && \
    echo 'export PATH="$HOME/.deno/bin:$PATH"' >> /etc/bash.bashrc

# Install NVM and set Node version
ENV NVM_DIR=/root/.nvm
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.4/install.sh | bash && \
    . $NVM_DIR/nvm.sh && \
    NODE_VERSION=$(jq -r '.engines.node' /tmp/package.json) && \
    nvm install $NODE_VERSION && \
    nvm use $NODE_VERSION && \
    nvm alias default $NODE_VERSION && \
    echo 'export NVM_DIR="$NVM_DIR"' >> /etc/bash.bashrc && \
    echo '[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"' >> /etc/bash.bashrc && \
    echo 'export PATH="$NVM_DIR/versions/node/v$NODE_VERSION/bin:$PATH"' >> /etc/bash.bashrc

# Install Yarn globally
RUN npm install -g yarn

# Install Meteor
RUN curl https://install.meteor.com/?release=$(curl -so- https://raw.githubusercontent.com/RocketChat/Rocket.Chat/develop/apps/meteor/.meteor/release | cut -d@ -f2) | sh && \
    echo 'export PATH=$PATH:/home/gitpod/.meteor' >> /etc/bash.bashrc

# Set the working directory to ensure permissions are correct
WORKDIR /workspaces/Rocket.Chat

# Install dependencies
RUN yarn
