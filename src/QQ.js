'use strict';

const fs = require('fs');

const login = require('./login');
const poll = require('./poll');

global.appid = 501004106;
global.clientid = 53999199;
global.font = {
    'name': '宋体',
    'size': 10,
    'style': [0, 0, 0],
    'color': '000000'
}

class QQ {
    constructor() {
        this.auth_options = {};
        this.toPoll = false;
        this.cookie = null;
        this.groups = {};
        this.group_code = {};
        this.discus = {};
        this.nickname = '';
    }

    Login() {
        fs.exists('./cookie.data', isExist => {
            if (isExist) {
                fs.readFile('./cookie.data', 'utf-8', function (err, data) {
                    login._Login(data, function () {
                        poll.startPoll();
                    });
                });
            } else {
                login.Login(function () {
                    poll.startPoll();
                });
            }
        });
    }
}

module.exports = QQ;