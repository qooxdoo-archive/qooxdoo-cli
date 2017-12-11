rmdir  /Q /S myapp
call qx create myapp -I  -V || EXIT /B 1
cd myapp
call qx contrib update -V || EXIT /B 1
call qx contrib list -V || EXIT /B 1
call qx contrib install oetiker/UploadWidget --release v1.0.0 -V || EXIT /B 1
call qx contrib install cboulanger/qx-contrib-Dialog --release v1.3.0-beta.3 -V || EXIT /B 1
call qx contrib install johnspackman/UploadMgr --release v1.0.0 -V || EXIT /B 1
call qx compile -V || EXIT /B 1
rmdir /Q /S contrib
call qx contrib install  -V || EXIT /B 1
call qx contrib remove cboulanger/qx-contrib-Dialog -V || EXIT /B 1
