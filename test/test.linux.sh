set -x 
rm -rf myapp
qx create myapp -I || exit $?
cd myapp
qx contrib update  || exit $?
qx contrib list    || exit $?
qx contrib install oetiker/UploadWidget --release v1.0.0  || exit $?
qx contrib install cboulanger/qx-contrib-Dialog --release v1.3.0-beta.3  || exit $?
qx contrib install johnspackman/UploadMgr --release v1.0.0  || exit $?
qx compile  || exit $?
rm -rf contrib  || exit $?
qx contrib install || exit $?
qx contrib remove cboulanger/qx-contrib-Dialog || exit $?
