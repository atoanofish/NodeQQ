const msgcontent = require('./msgcontent');
const client = require('../libs/httpclient');
const tuling = require('./tuling');
const _ =require('lodash');

let isWodi = false;
let group_code = new Array();

function hashU(x, K) {
    x += "";
    for (let N = [], T = 0; T < K.length; T++) N[T % 4] ^= K.charCodeAt(T);
    let U = ["EC", "OK"],
        V = [];
    V[0] = x >> 24 & 255 ^ U[0].charCodeAt(0);
    V[1] = x >> 16 & 255 ^ U[0].charCodeAt(1);
    V[2] = x >> 8 & 255 ^ U[1].charCodeAt(0);
    V[3] = x & 255 ^ U[1].charCodeAt(1);
    U = [];
    for (T = 0; T < 8; T++) U[T] = T % 2 == 0 ? N[T >> 1] : V[T >> 1];
    N = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F"];
    V = "";
    for (T = 0; T < U.length; T++) {
        V += N[U[T] >> 4 & 15];
        V += N[U[T] & 15]
    }
    return V;
};

function sendMsg(uin, msg, cb) {
    let params = {
        r: JSON.stringify({
            group_uin: uin,
            content: msgcontent.bulid(msg),
            clientid: clientid,
            msg_id: client.nextMsgId(),
            psessionid: global.auth_options.psessionid
        })
    };

    client.post({
        url: 'http://d1.web2.qq.com/channel/send_qun_msg2'
    }, params, function (ret) {
        cb && cb(ret);
    });
};

function getGroupCode(code, cb) {
    if (group_code[code]) {
        return cb(group_code[code]);
    }
    let params = {
        r: JSON.stringify({
            vfwebqq: global.auth_options.vfwebqq,
            hash: hashU(global.auth_options.uin, global.auth_options.ptwebqq)
        })
    };

    client.post({
        url: 'http://s.web2.qq.com/api/get_group_name_list_mask2'
    }, params, function (ret) {
        let data = ret.result.gnamelist;
        for (let i in data) {
            let item = _.pick(data[i], ['code', 'flag', 'gid', 'name']);
            group_code[data[i].gid] = item;
        }
        cb && cb(group_code[code]);
    });
};

function getGroupInfo(code, cb) {
    let self = this;
    let options = {
        method: 'GET',
        protocol: 'http:',
        host: 's.web2.qq.com',
        path: '/api/get_group_info_ext2?gcode=' + code + '&vfwebqq=' + global.auth_options.vfwebqq + '&t=' + Date.now(),
        headers: {
            'Referer': 'http://s.web2.qq.com/proxy.html?v=20130916001&callback=1&id=1',
        }
    };

    client.url_get(options, function (err, res, data) {
        data = data.result;
        data.mcount = data.minfo.length;
        data = _.pick(data, ['cards', 'ginfo', 'minfo', 'mcount']);
        self.groups[code] = data;
        cb && cb(err, data);
    });
};

function Handle(msg) {
    let isAt = msg.content.indexOf('@' + global.auth_options.nickname);
    if (isAt > -1) {
        let val = '';
        if (isAt == 0) {
            val = msg.content[3];
        } else {
            val = msg.content[1] + msg.content[4];
        }

        tuling.getMsg(val.trim(), str => sendMsg(msg.group_code, str));
    }
}

module.exports = {
    handle: Handle,
    getCode: getGroupCode,
    getInfo: getGroupInfo
}