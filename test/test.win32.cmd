rmdir  /Q /S myapp
call qx create myapp -I  || EXIT /B 1
cd myapp
call qx contrib update || EXIT /B 1
call qx contrib list || EXIT /B 1
call qx contrib install oetiker/UploadWidget --release v1.0.0 || EXIT /B 1
call qx contrib install cboulanger/qx-contrib-Dialog --release v1.3.0-beta.3 || EXIT /B 1
call qx contrib install johnspackman/UploadMgr --release v1.0.0 || EXIT /B 1
call qx compile || EXIT /B 1
rmdir /Q /S contrib
call qx contrib install  || EXIT /B 1
call qx contrib remove cboulanger/qx-contrib-Dialog || EXIT /B 1
