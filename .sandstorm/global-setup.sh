#!/bin/bash
set -x
set -euvo pipefail

echo localhost > /etc/hostname
hostname localhost
curl https://install.sandstorm.io/ > /host-dot-sandstorm/caches/install.sh
SANDSTORM_CURRENT_VERSION=$(curl -fs "https://install.sandstorm.io/dev?from=0&type=install")
SANDSTORM_PACKAGE="sandstorm-$SANDSTORM_CURRENT_VERSION.tar.xz"
if [[ ! -f /host-dot-sandstorm/caches/$SANDSTORM_PACKAGE ]] ; then
    curl --output "/host-dot-sandstorm/caches/$SANDSTORM_PACKAGE.partial" "https://dl.sandstorm.io/$SANDSTORM_PACKAGE"
    mv "/host-dot-sandstorm/caches/$SANDSTORM_PACKAGE.partial" "/host-dot-sandstorm/caches/$SANDSTORM_PACKAGE"
fi
bash /host-dot-sandstorm/caches/install.sh -d -e "/host-dot-sandstorm/caches/$SANDSTORM_PACKAGE"
modprobe ip_tables
# Make the vagrant user part of the sandstorm group so that commands like
# `spk dev` work.
usermod -a -G 'sandstorm' 'vagrant'
# Bind to all addresses, so the vagrant port-forward works.
sudo sed --in-place='' --expression='s/^BIND_IP=.*/BIND_IP=0.0.0.0/' /opt/sandstorm/sandstorm.conf
# TODO: update sandstorm installer script to ask about dev accounts, and
# specify a value for this option in the default config?
if ! grep --quiet --no-messages ALLOW_DEV_ACCOUNTS=true /opt/sandstorm/sandstorm.conf ; then
    echo "ALLOW_DEV_ACCOUNTS=true" | sudo tee -a /opt/sandstorm/sandstorm.conf
    sudo service sandstorm restart
fi
# Enable apt-cacher-ng proxy to make things faster if one appears to be running on the gateway IP
GATEWAY_IP=$(ip route  | grep ^default  | cut -d ' ' -f 3)
if nc -z "$GATEWAY_IP" 3142 ; then
    echo "Acquire::http::Proxy \"http://$GATEWAY_IP:3142\";" > /etc/apt/apt.conf.d/80httpproxy
fi
