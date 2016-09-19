const msgcontent = require('./msgcontent');
const client = require('../libs/httpclient');
const tuling = require('./tuling');

function sendMsg(uin, msg, callback) {
    let params = {
        r: JSON.stringify({
            to: uin,
            face: 522,
            content: msgcontent.bulid(msg),
            clientid: global.clientid,
            msg_id: client.nextMsgId(),
            psessionid: global.auth_options.psessionid
        })
    };

    client.post({
        url: 'http://d1.web2.qq.com/channel/send_buddy_msg2'
    }, params, function (response) {
        callback && callback(response);
    });
};

function Handle(item, callback) {
    tuling.getMsg(item.content[1], str => {
        sendMsg(item.from_uin, str, callback);
    })
}

module.exports = {
    handle: Handle
}