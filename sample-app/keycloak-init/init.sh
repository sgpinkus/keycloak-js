#!/bin/bash -e
# https://www.keycloak.org/docs/latest/server_admin/index.html#admin-cli
trap "cleanup" EXIT
echo "Setting up keycloak realms and clients."
cd $(dirname "${BASH_SOURCE[0]:-$0}")

realm="testing"

cleanup() {
  rm -f /tmp/kc.conf
}

realm_exists() {
  kcadm.sh get realms --fields 'realm' --noquotes --format csv --config /tmp/kc.conf | grep -q "$1"
  return $?
}

get_user_id() {
  kcadm.sh get users -r master --config /tmp/kc.conf -q username="$1" --fields id --format csv --noquotes
}

# Using --noconfig cause credentials error when working with other realms so just using the cred config way.
kcadm.sh config credentials \
  --server "http://$KEYCLOAK_HOST:$KEYCLOAK_HTTP_PORT" \
  --realm master \
  --user "$KEYCLOAK_ADMIN_USER" --password "$KEYCLOAK_ADMIN_PASSWORD" \
  --config /tmp/kc.conf

if ! realm_exists "${realm}"; then
  kcadm.sh create realms \
    --config /tmp/kc.conf \
    -s realm="${realm}" -s "enabled=true"
  kcadm.sh create users \
    --config /tmp/kc.conf \
    -r "${realm}" \
    -s "username=bob" \
    -s "firstName=Bob" \
    -s "email=bob@mail.localhost" \
    -s "emailVerified=true" \
    -s "enabled=true" \
    -s "attributes.picture=https://randomuser.me/api/portraits/lego/1.jpg"
  kcadm.sh set-password \
    --config /tmp/kc.conf \
    -r "${realm}" \
    --username bob --new-password password # Cant do this from create user
else
  echo "Realm ${realm} already exists"
fi

kcadm.sh create clients \
  --config /tmp/kc.conf \
  -r "${realm}" \
  -f ./client.json || true
