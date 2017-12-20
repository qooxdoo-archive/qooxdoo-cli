set -x 
rm -rf myapp
qx create myapp -I -v || exit $?
cd myapp
qx compile -v --clean || exit $?
qx contrib update  -v|| exit $?
qx contrib list    -v|| exit $?
qx contrib install oetiker/UploadWidget --release v1.0.0 -v || exit $?
qx contrib install cboulanger/qx-contrib-Dialog --release v1.3.0-beta.3 -v || exit $?
qx contrib install johnspackman/UploadMgr --release v1.0.0 -v || exit $?
qx compile -v --clean || exit $?
rm -rf contrib  || exit $?
qx contrib install -v || exit $?
qx compile -v --clean || exit $?
qx contrib remove cboulanger/qx-contrib-Dialog -v || exit $?
qx compile -v --clean || exit $?
call qx lint --fix ||  exit $?