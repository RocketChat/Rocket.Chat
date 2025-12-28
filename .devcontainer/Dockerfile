FROM mcr.microsoft.com/vscode/devcontainers/base:ubuntu

COPY package.json /tmp/package.json

RUN apt-get update && apt-get install -y \
    apt-transport-https \
    build-essential \
    ca-certificates \
    curl \
    jq \
    libssl-dev && \
    rm -rf /var/lib/apt/lists/*

ENV NVM_DIR /usr/local/nvm
RUN mkdir -p $NVM_DIR && \
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash && \
    bash -c ". $NVM_DIR/nvm.sh && nvm install $(jq -r '.engines.node' /tmp/package.json) && npm install -g yarn"

RUN echo "export NVM_DIR=$NVM_DIR" >> /etc/bash.bashrc && \
    echo "[ -s \"$NVM_DIR/nvm.sh\" ] && \. \"$NVM_DIR/nvm.sh\"" >> /etc/bash.bashrc

ENV DENO_INSTALL=/usr/local/deno
RUN mkdir -p $DENO_INSTALL && \
    curl -fsSL https://deno.land/install.sh | sh

ENV DENO_INSTALL="/usr/local/deno"
ENV PATH="$DENO_INSTALL/bin:$PATH"

RUN echo 'export DENO_INSTALL="/usr/local/deno"' >> /etc/bash.bashrc && \
    echo 'export PATH="$DENO_INSTALL/bin:$PATH"' >> /etc/bash.bashrc

ENV METEOR_INSTALL="/usr/local/meteor"
ENV PATH="$METEOR_INSTALL/bin:$PATH"

RUN curl https://install.meteor.com/ | sh && \
    mv ~/.meteor $METEOR_INSTALL

RUN echo 'export METEOR_INSTALL="/usr/local/meteor"' >> /etc/bash.bashrc && \
    echo 'export PATH="$METEOR_INSTALL/bin:$PATH"' >> /etc/bash.bashrc

CMD ["bash"]
