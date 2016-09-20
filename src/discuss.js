const msgcontent = require('./msgcontent');
const client = require('../libs/httpclient');
const tuling = require('./tuling');
const _ = require('lodash');

const regAtName = new RegExp(`@{global.auth_options.nickname}`);

function sendMsg(uin, msg, callback) {
    var params = {
        r: JSON.stringify({
            did: uin,
            content: msgcontent.bulid(msg),
            face: 537,
            clientid: clientid,
            msg_id: client.nextMsgId(),
            psessionid: global.auth_options.psessionid
        })
    };

    client.post({
        url: 'http://d1.web2.qq.com/channel/send_discu_msg2'
    }, params, function (ret) {
        callback && callback(ret);
    });
};

function getDiscussInfo(code, cb) {
    var options = {
        method: 'GET',
        protocol: 'http:',
        host: 's.web2.qq.com',
        path: '/api/get_group_info_ext2?gcode=' + code + '&vfwebqq=' + this.auth_options.vfwebqq + '&t=' + Date.now(),
        headers: {
            'Referer': 'http://s.web2.qq.com/proxy.html?v=20130916001&callback=1&id=1',
        }
    };

    client.url_get(options, function (err, res, data) {
        data = data.result;
        data.mcount = data.minfo.length;
        data = _.pick(data, ['cards', 'ginfo', 'minfo', 'mcount']);
        groups[code] = data;
        cb(err, data);
    });
};

function Handle(msg) {
    var isAt = msg.content[1].indexOf('@' + global.auth_options.nickname);
    if (isAt > -1) {
        var val = msg.content[1].replace(regAtName, '');
        tuling.getMsg(val.trim(), str => sendMsg(msg.did, str));
    }
}

module.exports = {
    handle: Handle
}