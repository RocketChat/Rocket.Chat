#!/bin/bash

# Se déplacer dans le dossier du projet
cd /opt/rocketchat

# Configurer le PATH pour utiliser Node v22 local ET Meteor
export PATH=/opt/rocketchat/node-v22/bin:/home/dell/.meteor:$PATH

# Configurer Deno
export DENO_INSTALL="$HOME/.deno"
export PATH="$DENO_INSTALL/bin:$PATH"

echo "🚀 Préparation du PATH terminée."
echo "📦 Lancement de Rocket.Chat avec yarn dsv (limité à 4 CPUs)..."

# Lancer avec yarn dsv et limitation CPU
yarn dsv --concurrency 4
