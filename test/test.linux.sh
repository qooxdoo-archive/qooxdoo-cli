rm -rf myapp
qx create myapp -I
cd myapp
qx contrib update
qx contrib list
qx contrib install oetiker/UploadWidget --release v1.0.0
qx contrib install cboulanger/qx-contrib-Dialog --release v1.3.0-beta.3
qx contrib install johnspackman/UploadMgr --release v1.0.0
qx compile
rm -rf contrib
qx contrib install 
qx contrib remove cboulanger/qx-contrib-Dialog
