#! /usr/bin/env bash

readonly RED="\033[0;31m"
readonly BLUE="\033[0;34m"
readonly CYAN="\033[0;36m"
readonly GREEN="\033[0;32m"
readonly YELLOW="\033[0;33m"
readonly NOCOLOR="\033[0m"

readonly DOCKER_INSTALL_SCRIPT_LOCATION="https://get.docker.com"
# change to go.rocket.chat locations
readonly -A COMPOSE_TEMPLATE=([name]="compose.yml" [location]="https://raw.githubusercontent.com/RocketChat/Rocket.Chat/prod-compose-update/apps/meteor/deploy/compose.yml")
readonly -A COMPOSE_ROLE_FIX_SCRIPT=([name]="user_set_role_cluster_monitor.sh" [location]="https://raw.githubusercontent.com/RocketChat/Rocket.Chat/prod-compose-update/apps/meteor/deploy/user_set_role_cluster_monitor.sh")
readonly -A COMPOSE_TRAEFIK_TEMPLATE=([name]="traefik.yml" [location]="https://raw.githubusercontent.com/RocketChat/Rocket.Chat/prod-compose-update/apps/meteor/deploy/traefik.yml")

am_i_root() {
  ! (( $(id -u) ))
}

_print_with_color() {
  # idk whether I should skip these messages if dry running
  # ((DRY_RUN)) && return 
  local COLOR=$1
  shift
  local TYPE=$1
  shift
  printf "${COLOR}${TYPE}${NOCOLOR} ${@}\n"
}

info() {
  _print_with_color $CYAN "[INFO]" "$*"
}

success_msg() {
  _print_with_color $GREEN "[SUCCESS]" "$*"
}

warn() {
  _print_with_color $YELLOW "[WARNING]" "$*"
}

error() {
  _print_with_color $RED "[ERROR]" "$*"
  exit 1
}

command_exists() {
  &>/dev/null command -v ${1?}
}

_substitute_or_inject_variable() {
  local variable=${1?} value=${2?} file=${3?}
  ((DRY_RUN)) && { info "$variable=$value"; return; }
  if grep -Eq "^$variable=.+" $file && ! ((FORCE)); then
    warn "value for \"$variable\" already exists; skipping"
    return
  fi
  # comment out the existing value and put the new value in
  grep -Eq "^$variable=" $file && sed -iE "s/^$variable=.*/# &/; a $variable=$value" $file
  # there was no existing value so nothing was commented or appended
  grep -Eq "^$variable=" $file || printf "$variable=$value\n" >> $file 
}

# placeholder
run() { true; }

_print_code() {
  local depth=
  for ((pos=$(( ${#FUNCNAME[@]} - 1 )); pos >= 1; pos--)); do
    depth+="+"
  done
  printf "$depth $*\n"
}

do_install_docker() {
  ((DRY_RUN)) && 
    _print_code "curl -L $DOCKER_INSTALL_SCRIPT_LOCATION | sh" || 
    { curl -L $DOCKER_INSTALL_SCRIPT_LOCATION | sh; }
}

do_install_compose() {
  # hardcoding for now
  local compose_version="2.5.0"
  local docker_config="$HOME/.docker"
  if am_i_root; then
    warn "root user detected...installing compose v2 globally"
    docker_config="/usr/local/lib/docker"
  fi
  run_sudoless mkdir -p $docker_config/cli-plugins
  run_sudoless curl -SL https://github.com/docker/compose/releases/download/v$compose_version/docker-compose-linux-x86_64 -o $docker_config/cli-plugins/docker-compose ||
    error "compose v2 binary download failed"
  run_sudoless chmod +x $docker_config/cli-plugins/docker-compose
  success_msg "compose v2 successfully installed!"
}

download_files() {
  local name location
  info "downloading templates and helpers"
  for obj in COMPOSE_TEMPLATE COMPOSE_ROLE_FIX_SCRIPT; do 
    name="$(eval printf \${$obj\[name\]})"
    location="$(eval printf \${$obj\[location\]})"
    run_sudoless curl -fsSL $location -o $name || error "failed to download $name"
  done
  if ((ENABLE_HTTPS)); then
    info "downloading traefik template"
    run_sudoless curl -fsSL ${COMPOSE_TRAEFIK_TEMPLATE[location]} -o ${COMPOSE_TRAEFIK_TEMPLATE[name]} || 
      error "failed to download ${COMPOSE_TRAEFIK_TEMPLATE[name]}"
  fi
}


install_docker() {
  if command_exists "docker"; then
    success_msg "docker is already installed!"
    return
  fi

  info "installing docker using official install script ($DOCKER_INSTALL_SCRIPT_LOCATION)"
  if do_install_docker; then
    success_msg "docker successfully installed!"
  else
    # we should error out of here right now
    error "installing docker failed! actual error message should be somewhere up there"
  fi
}

install_docker_compose() {
  if &>/dev/null docker compose version; then
    success_msg "compose v2 already installed!"
    return
  fi

  warn "compose v2 not found"
  local distro="$(. /etc/os-release; echo $ID)"

  case $distro in
    'ubuntu'|'debian')
      if [[ -n "$(apt search docker-compose-plugin -qqq)" ]]; then
        run apt install docker-compose-plugin -yqqq || error "failed to install compose v2"
        success_msg "compose v2 successfully installed"
        return
      fi
    ;;
    'centos')
      # do stuff
    ;;
  esac
  warn "compose v2 not found on the repos...attempting manual install"
  do_install_compose
}

post_install_docker() {
  if am_i_root; then
    warn "root user detected"
    info "ignoring docker group"
  else
    if groups | grep -qw 'docker'; then
      success_msg "\"$USER\" is already in the docker group!"
    else
      info "adding \"$USER\" to the docker group"
      run usermod -aG docker $USER
      run_sudoless newgrp
    fi
  fi
  if [[ $(systemctl is-active docker) == "active" ]]; then
    success_msg "docker daemon already running!"
  else
    info "enabling docker daemon"
    run systemctl enable --now docker
  fi
}

generate_passwords() {
  if command_exists "openssl"; then
    random_password() {
      openssl rand -hex ${1:-26}
    }
  else
    random_password() {
      head -c${1:-26} /dev/urandom | hexdump -e '/1 "%02x"'
    }
  fi

  declare -A secrets=([MONGODB_PASSWORD]="$(random_password)" [MONGODB_ROOT_PASSWORD]="$(random_password)" [MONGODB_REPLICA_SET_KEY]="$(random_password 8)")

  [[ -f .env ]] || touch .env

  info "generating passwords and secret keys for deployment"

  for variable in "MONGODB_ROOT_PASSWORD" "MONGODB_PASSWORD" "MONGODB_REPLICA_SET_KEY"; do
    _substitute_or_inject_variable "$variable" "${secrets[$variable]}" .env
  done
}

deploy() {
  if ((ENABLE_HTTPS)); then
    _substitute_or_inject_variable BIND_IP 127.0.0.1 .env
    read -p "please enter your domain name (without the 'https://'): " domain
    _substitute_or_inject_variable DOMAIN $domain .env
    _substitute_or_inject_variable ROOT_URL "https://$domain" .env
  fi

  info "pulling docker images"
  run_sudoless docker compose -f ${COMPOSE_TEMPLATE[name]} pull || error "failed to pull some images; see above for more information"
  ((ENABLE_HTTPS)) && { run_sudoless docker compose -f ${COMPOSE_TRAEFIK_TEMPLATE[name]} pull || error "failed to pull traefik image; see above for more information"; }

  info "deploying Rocket.Chat"
  run_sudoless docker compose -f ${COMPOSE_TEMPLATE[name]} up -d || error "Rocket.Chat deployment failed; see above for more information"
  ((ENABLE_HTTPS)) && { run_sudoless docker compose -f ${COMPOSE_TRAEFIK_TEMPLATE[name]} up -d || error "traefik deployment failed; see above for more information"; }
}


main() {
  DRY_RUN=0
  ENABLE_HTTPS=0
  while [[ -n "$1" ]]; do
    case "$1" in
      "--dry-run") DRY_RUN=1; shift ;;
      "--enable-https") ENABLE_HTTPS=1; shift ;;
      "--force") FORCE=1; shift ;;
      *) 
        error "unknown option $1"
        return 1
      ;;
    esac
  done

  if ((DRY_RUN)); then
    run() {
      _print_code "$@"
    }
    run_sudoless() {
      _print_code "$@"
    }
  else
    run_sudoless() {
      "$@"
    }
    if am_i_root; then
      run() {
        "$@"
      }
    else
      run() {
        sudo "$@"
      }
    fi
  fi

  local project_directory="rocketchat"

  while [[ -d $project_directory ]]; do
    warn "dir '$project_directory' already exists"
    read -p "please enter a new project directory: " project_directory
  done

  info "creating new project directory: $project_directory"
  run_sudoless mkdir -p $project_directory
  run_sudoless cd $project_directory

  install_docker
  install_docker_compose
  post_install_docker
  download_files
  generate_passwords
  deploy
}
