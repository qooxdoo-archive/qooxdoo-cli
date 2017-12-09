rmdir  /Q /S myapp
call qx create myapp -I 
cd myapp
call qx contrib update
call qx contrib list
call qx contrib install oetiker/UploadWidget --release v1.0.0
call qx contrib install cboulanger/qx-contrib-Dialog --release v1.3.0-beta.3
call qx contrib install johnspackman/UploadMgr --release v1.0.0
call qx compile
rmdir /Q /S contrib
call qx contrib install 
call qx contrib remove cboulanger/qx-contrib-Dialog
