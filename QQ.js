var fs = require('fs');
var async = require('async');
var Log = require('log');

var client = require('./libs/httpclient');

var log = new Log('debug');

var appid = 501004106;
var clientid  = 53999199;
var font = {
  'name': '宋体',
  'size': 10,
  'style': [0, 0, 0],
  'color':  '000000'
}

var z = 0;
var q = Date.now();
q = (q - q % 1E3) / 1E3;
q = q % 1E4 * 1E4;
function nextMsgId() {
    z++;
    return q + z;
}

function sleep(milliSeconds) { 
    var startTime = new Date().getTime(); 
    while (new Date().getTime() < startTime + milliSeconds);
};

var QQ = module.exports = function () {
    this.auth_options = {};
    this.toPoll = false
};

QQ.prototype.getPtwebqq = function (url, cb) {
    client.url_get(url, function(err, res, data){
        if(! err)
            return cb(data);
    });
};

QQ.prototype.prepareLogin = function (callback) {
    var self = this;
    var url = "https://ssl.ptlogin2.qq.com/ptqrshow?appid=501004106&e=0&l=M&s=5&d=72&v=4&t=" + Math.random();

    client.url_get(url, function(err, res, data) {
        fs.writeFile('./code.png', data, 'binary', function (err) {
            if (err) {
                console.log(err);
            }
            else {
                console.log("down success");
                require('child_process').exec('open ./code.png');
                self.waitingScan(callback);
            }
        });
    }, function(res){
        res.setEncoding('binary');
    });
};

QQ.prototype.checkVcode = function (cb) {
    var options = {
        protocol: 'https:',
        host: 'ssl.ptlogin2.qq.com',
        path: '/ptqrlogin?webqq_type=10&remember_uin=1&login2qq=1&aid=' + appid + '&u1=http%3A%2F%2Fw.qq.com%2Fproxy.html%3Flogin2qq%3D1%26webqq_type%3D10&ptredirect=0&ptlang=2052&daid=164&from_ui=1&pttype=1&dumy=&fp=loginerroralert&action=0-0-' + (Math.random() * 900000 + 1000000) +'&mibao_css=m_webqq&t=undefined&g=1&js_type=0&js_ver=10141&login_sig=&pt_randsalt=0',
        headers: {
            'Cookie': client.get_cookies_string(),
            'Referer': 'https://ui.ptlogin2.qq.com/cgi-bin/login?daid=164&target=self&style=16&mibao_css=m_webqq&appid=501004106&enable_qlogin=0&no_verifyimg=1&s_url=http%3A%2F%2Fw.qq.com/proxy.html&f_url=loginerroralert&strong_login=1&login_state=10&t=20130723001&f_qr=0'
        }
    };

    client.url_get(options, function (err, res, data) {
        var ret = data.match(/\'(.*?)\'/g).map(function (i) {
            var last = i.length - 2;
            return i.substr(1, last);
        });
        cb(ret);
    });
};

QQ.prototype.waitingScan = function (callback) {
    var self = this;
    log.info("登录 step1 等待二维码校验结果");
    self.checkVcode(function (ret) {
        var retCode = parseInt(ret[0]);
        if (retCode === 0 && ret[2].match(/^http/)) {
            require('child_process').exec('rm -rf ./code.png');

            log.info("登录 step2 cookie 获取 ptwebqq");
            self.getPtwebqq(ret[2], function (ret) {
                self.ptwebqq = client.get_cookies().filter(function (item) {
                    return item.match(/ptwebqq/);
                }).pop().replace(/ptwebqq\=(.*?);.*/, '$1');

                self.Login(self.ptwebqq, function (ret) {
                    if (ret.retcode === 0) {
                        self.vfwebqq = ret.result.vfwebqq;

                        log.info("登录 step4 获取 uin, psessionid");
                        self.loginToken(self.ptwebq, null, function (ret) {
                            if (ret.retcode === 0) {
                                log.info('登录成功');
                                self.auth_options = {
                                    clientid: clientid,
                                    ptwebqq: self.ptwebqq,
                                    vfwebqq: self.vfwebqq,
                                    uin: ret.result.uin,
                                    psessionid: ret.result.psessionid
                                };
                                callback(client.get_cookies(), self.auth_options);
                            }
                            else {
                                log.info("登录失败");
                                return log.error(ret);
                            }
                        });
                    }
                });
            });
        }
        else if (retCode === 66 || retCode === 67) {
            sleep(1000);
            self.waitingScan(callback);
        }
        else {
            log.error("登录 step1 failed", ret);
            return;
        }
    });
};

QQ.prototype.loginToken = function (ptwebqq, psessionid, cb) {
    if (!psessionid) psessionid = null;
    var form = {
        r: JSON.stringify({
            ptwebqq: ptwebqq,
            clientid: clientid,
            psessionid: psessionid || "",
            status: "online"
        })
    };
    client.url_post({
        protocol: 'http:',
        host: 'd1.web2.qq.com',
        path: '/channel/login2',
        method: 'POST',
        headers: {
            'Origin': 'http://d1.web2.qq.com',
            'Referer': 'http://d1.web2.qq.com/proxy.html?v=20151105001&callback=1&id=2',
        }
    }, form, function (err, res, data) {
        var ret = JSON.parse(data);
        cb(ret);
    });
};

QQ.prototype.Login = function (ptwebqq, cb) {
    log.info("登录 step3 获取 vfwebqq");
    var options = {
        method: 'GET',
        protocol: 'http:',
        host: 's.web2.qq.com',
        path: '/api/getvfwebqq?ptwebqq=' + ptwebqq + '&clientid=' + clientid + '&psessionid=&t=' + Math.random(),
        headers: {
            'Cookie': client.get_cookies_string(),
            'Origin': 'http://s.web2.qq.com',
            'Referer': 'http://s.web2.qq.com/proxy.html?v=20130916001&callback=1&id=1',
        }
    };
    client.url_get(options, function (err, res, data) {
        var ret = JSON.parse(data);
        cb(ret);
    });
};


QQ.prototype._Login = function (cookie, callback) {
    var self = this;

    log.info("自动登录");
    this.ptwebqq = cookie.match(/ptwebqq=(.+?);/)[1];

    client.set_cookies(cookie);

    this.loginToken(this.ptwebqq, null, function (ret) {
        if (ret.retcode === 0) {
            log.info('登录成功');
            self.auth_options = {
                clientid: clientid,
                ptwebqq: self.ptwebqq,
                vfwebqq: self.vfwebqq,
                uin: ret.result.uin,
                psessionid: ret.result.psessionid
            };
            self.startPoll(self.auth_options);
            callback(client.get_cookies(), self.auth_options);
        }
        else {
            log.info("登录失败");
            return log.error(ret);
        }
    });
};

QQ.prototype.getAuth = function() {
    return this.auth_options;
};

QQ.prototype.onPoll = function (aaa, cb) {
    var params = {
        r: JSON.stringify({
            ptwebqq: this.auth_options.ptwebqq,
            clientid: this.auth_options.clientid,
            psessionid: this.auth_options.psessionid,
            key: ""
        })
    };
    client.post({
        url: "http://d1.web2.qq.com/channel/poll2"
    }, params, function(ret, e) {
        cb(ret);
    });
};

QQ.prototype.stopPoll = function () {
    this.toPoll = false;
};

QQ.prototype.startPoll = function (auth_options) {
    this.toPoll = true;
    log.debug('polling...');
    this.loopPoll(auth_options);
};

QQ.prototype.loopPoll = function (auth_options) {
    if (!this.toPoll) return;
    var self = this;
    this.onPoll(auth_options, function (e) {
        if (e.result) {
            self.sendBuddyMsg(e.result[0].value.from_uin, 'aaa', function(){
                log.info('回复成功');
            });
        }
        setTimeout(function(){
            self.loopPoll();
        }, e ? 1000 : 0)
    })
};

QQ.prototype.sendBuddyMsg = function (uin, msg, cb) {
    var params = {
        r: JSON.stringify({
            to: uin,
            face: 147,
            content: JSON.stringify(['' + uin, ['font', font]]),
            clientid: clientid,
            msg_id: nextMsgId(),
            psessionid: this.auth_options.psessionid
        })
    };
    log.debug(params);
    client.post({
        url: 'http://d1.web2.qq.com/channel/send_buddy_msg2'
    }, params, function(ret, e) {
        console.log(ret);
    });
};

QQ.prototype.Robot = function (callback) {
    var self = this;

    fs.exists('./cookie.data', function (isExist) {
        if (isExist) {
            fs.readFile('./cookie.data', 'utf8', function (err, data){
                self._Login(data, callback);
            });
        }
        else {
            self.prepareLogin(callback);
        }
    });
};