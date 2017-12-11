set -x 
rm -rf myapp
qx create myapp -I -V || exit $?
cd myapp
qx contrib update  -V|| exit $?
qx contrib list    -V|| exit $?
qx contrib install oetiker/UploadWidget --release v1.0.0 -V || exit $?
qx contrib install cboulanger/qx-contrib-Dialog --release v1.3.0-beta.3 -V || exit $?
qx contrib install johnspackman/UploadMgr --release v1.0.0 -V || exit $?
qx compile -V || exit $?
rm -rf contrib  || exit $?
qx contrib install -V || exit $?
qx contrib remove cboulanger/qx-contrib-Dialog -V || exit $?
