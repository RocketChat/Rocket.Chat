FROM mcr.microsoft.com/vscode/devcontainers/base:ubuntu-24.04

# Pinned versions are read from the repo so the image stays in sync with CI:
#   - package.json               -> engines.node / volta.node, packageManager (yarn)
#   - .tool-versions             -> deno
#   - apps/meteor/.meteor/release -> meteor
COPY package.json /tmp/package.json
COPY .tool-versions /tmp/.tool-versions
COPY apps/meteor/.meteor/release /tmp/meteor-release

RUN apt-get update && apt-get install -y \
    apt-transport-https \
    build-essential \
    ca-certificates \
    curl \
    jq \
    libssl-dev \
    unzip \
    # Tooling for the default-deny egress firewall (init-firewall.sh)
    iptables \
    ipset \
    dnsutils \
    aggregate && \
    rm -rf /var/lib/apt/lists/*

# --- Node via Volta -----------------------------------------------------------
# Volta manages the Node/Yarn toolchain and transparently honours the `volta`
# and `packageManager` fields in package.json when running inside the project.
ENV VOLTA_HOME="/usr/local/volta"
ENV PATH="$VOLTA_HOME/bin:$PATH"
RUN mkdir -p $VOLTA_HOME && \
    curl https://get.volta.sh | bash -s -- --skip-setup && \
    volta install node@$(jq -r '.volta.node' /tmp/package.json) && \
    volta install yarn@$(jq -r '.volta.yarn' /tmp/package.json) && \
    echo 'export VOLTA_HOME="/usr/local/volta"\nexport PATH="$VOLTA_HOME/bin:$PATH"' >> /etc/profile.d/volta.sh

# --- Deno (pinned) ------------------------------------------------------------
ENV DENO_INSTALL="/usr/local/deno"
ENV PATH="$DENO_INSTALL/bin:$PATH"
RUN mkdir -p $DENO_INSTALL && \
    curl -fsSL https://deno.land/install.sh | \
    sh -s "v$(awk '$1=="deno"{ print $2 }' /tmp/.tool-versions)" && \
    echo 'export DENO_INSTALL="/usr/local/deno"\nexport PATH="$DENO_INSTALL/bin:$PATH"' >> /etc/profile.d/deno.sh

# --- Meteor -------------------------------------------------------------------
# The launcher (/usr/local/bin/meteor, already on PATH) resolves its warehouse as
#   METEOR_WAREHOUSE_DIR="${METEOR_WAREHOUSE_DIR:-$HOME/.meteor}"
# so this var is what makes the baked-in warehouse visible to every user. Without
# it the launcher falls back to $HOME/.meteor, finds nothing for `vscode`, and
# re-downloads the whole distribution on first run — which the egress firewall
# then blocks. No PATH entry is needed: the warehouse has `meteor` at its root,
# not under bin/.
ENV METEOR_WAREHOUSE_DIR="/usr/local/meteor"
# The ?release= pin matters: install.meteor.com defaults to the newest release,
# but the project runs whatever apps/meteor/.meteor/release says. Installing the
# newest one means the first in-project command has to download the pinned
# meteor-tool anyway, so the bundled copy is dead weight. Reading the pin here
# puts the exact tool the project needs into the image.
# The chown shares a layer with the install deliberately: Meteor writes package
# downloads into the warehouse, so it must be owned by `vscode` — but doing it in
# a separate RUN would copy the entire ~1GB warehouse into a second layer.
RUN curl "https://install.meteor.com/?release=$(sed 's/^METEOR@//' /tmp/meteor-release)" | sh && \
    mv ~/.meteor "$METEOR_WAREHOUSE_DIR" && \
    chown -R vscode:vscode "$METEOR_WAREHOUSE_DIR" && \
    echo 'export METEOR_WAREHOUSE_DIR="/usr/local/meteor"' >> /etc/profile.d/meteor.sh

# --- Egress firewall ----------------------------------------------------------
# Applied at container start via the devcontainer postStartCommand (as sudo).
#
# NOT installed as /usr/local/bin/init-firewall.sh: the claude-code devcontainer
# feature unconditionally copies its own script to that exact path, and features
# are layered on top of this Dockerfile — so that name is silently overwritten.
COPY .devcontainer/init-firewall.sh /usr/local/bin/rc-init-firewall.sh
RUN chmod +x /usr/local/bin/rc-init-firewall.sh

CMD ["bash"]
