#! /bin/bash

# #include <everything>
source /opt/bitnami/scripts/libmongodb.sh

error_and_abort() {
  error "$@"
  exit 1
}

main() {
  # mongodb_wait_for_primary_node "$MONGODB_INITIAL_PRIMARY_HOST" "$MONGODB_INITIAL_PRIMARY_PORT_NUMBER" "$MONGODB_INITIAL_PRIMARY_ROOT_USER" "$MONGODB_INITIAL_PRIMARY_ROOT_PASSWORD"
  info "attempting to add clusterMonitor role to user $MONGODB_USERNAME"
  local cmd="
    db.getSiblingDB('$MONGODB_DATABASE').grantRolesToUser(
      '$MONGODB_USERNAME',
      [
        {
          role: 'clusterMonitor',
          db: 'admin'
        }
      ]
    )
  "
  debug "Executing: ${cmd:5:-1}"
  local out=$(mongodb_execute_print_output "$MONGODB_ROOT_USER" "$MONGODB_ROOT_PASSWORD" "admin" "" "" "--quiet" <<< "$cmd")
  # local ok=$(perl -MJSON -0ne 'print decode_json($_)->{"ok"}' <<< "$out")
  [[ -z $out ]] || error_and_abort "failed to add role clusterMonitor to user \"$MONGODB_USERNAME\"; Error: $out"
  info "clusterMonitor role added to $MONGODB_USERNAME"
}

main
