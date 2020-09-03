# creates a nodejs app bundle
set -x
TMP=$(mktemp -ud -t rocketchat-build-XXXXXXXXXXXX --tmpdir=/home/$USER/tmp)
rm -rf $TMP

meteor npm install
meteor build --directory $TMP

# create docker image
cp ./.docker/Dockerfile $TMP
cd $TMP
docker build -t rocketchat .
rm -rf $TMP
