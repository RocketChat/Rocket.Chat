#!/bin/bash
set -x
set -euvo pipefail

apt-get update
apt-get install build-essential git -y

cd /opt/

NODE_ENV=production
PACKAGE=meteor-spk-0.4.0
PACKAGE_FILENAME="$PACKAGE.tar.xz"
CACHE_TARGET="/host-dot-sandstorm/caches/${PACKAGE_FILENAME}"

# Fetch meteor-spk tarball if not cached
if [ ! -f "$CACHE_TARGET" ] ; then
    curl https://dl.sandstorm.io/${PACKAGE_FILENAME} > "$CACHE_TARGET"
fi

# Extract to /opt
tar xf "$CACHE_TARGET"

# Create symlink so we can rely on the path /opt/meteor-spk
ln -s "${PACKAGE}" meteor-spk

# Add bash, and its dependencies, so they get mapped into the image.
# Bash runs the launcher script.
cp -a /bin/bash /opt/meteor-spk/meteor-spk.deps/bin/
cp -a /lib/x86_64-linux-gnu/libncurses.so.* /opt/meteor-spk/meteor-spk.deps/lib/x86_64-linux-gnu/
cp -a /lib/x86_64-linux-gnu/libtinfo.so.* /opt/meteor-spk/meteor-spk.deps/lib/x86_64-linux-gnu/

# Unfortunately, Meteor does not explicitly make it easy to cache packages, but
# we know experimentally that the package is mostly directly extractable to a
# user's $HOME/.meteor directory.
METEOR_RELEASE=1.6.1
METEOR_PLATFORM=os.linux.x86_64
METEOR_TARBALL_FILENAME="meteor-bootstrap-${METEOR_PLATFORM}.tar.gz"
METEOR_TARBALL_URL="https://d3sqy0vbqsdhku.cloudfront.net/packages-bootstrap/${METEOR_RELEASE}/${METEOR_TARBALL_FILENAME}"
METEOR_CACHE_TARGET="/host-dot-sandstorm/caches/${METEOR_TARBALL_FILENAME}"

# Fetch meteor tarball if not cached
if [ ! -f "$METEOR_CACHE_TARGET" ] ; then
    curl "$METEOR_TARBALL_URL" > "${METEOR_CACHE_TARGET}.partial"
    mv "${METEOR_CACHE_TARGET}"{.partial,}
fi

# Extract as unprivileged user, which is the usual meteor setup
cd /home/vagrant/
su -c "tar xf '${METEOR_CACHE_TARGET}'" vagrant
# Link into global PATH
ln -s /home/vagrant/.meteor/meteor /usr/bin/meteor
chown vagrant:vagrant /home/vagrant -R
