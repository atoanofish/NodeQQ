var fs = require('fs');

var QQ = require('./QQ');

var qq = new QQ();

qq.Robot(function(cookie, info){
    fs.exists('./cookie.data', function (isExist) {
        if (!isExist) {
            fs.writeFile('./cookie.data', cookie);
        }
    });
    // console.log(qq.getAuth());
});