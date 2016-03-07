
//======================【对象】====================================================

//游戏配置
var config = {
	host: '127.0.0.1',
	port: '8000',
    radius: [20, 25, 30, 35, 50],
    speed: [6, 5, 4, 3, 2],
    maxNum: [40, 40, 50, 50, 60]
}
//服务器
var Server = {
    clients: [],
    battles: [],
    getClientIndex: function (conn) {
        var me = this;
        for (var i = 0; i < me.clients.length; i++) {
            if (me.clients[i].client == conn) {
                return i;
            }
        }
        return -1;
    },
    getClientIndexByID: function (id) {
        var me = this;
        for (var i = 0; i < me.clients.length; i++) {
            if (me.clients[i].id == id) {
                return i;
            }
        }
        return -1;
    },
    getBattleIndex: function (conn) {
        var me = this;
        var client = me.clients[me.getClientIndex(conn)];
        for (var i = 0; i < me.battles.length; i++) {
            if (me.battles[i].clients['A'] == client || me.battles[i].clients['B'] == client) {
                return i;
            }
        }
        return -1;
    }
}

//客户端
function Client(client, id, tID, side) {
    this.client = client;
    this.id = id; 	//客户端ID
    this.targetID = tID; //对手ID
    this.side = side; //阵营
    this.moveSpeed = 5;  //默认移动速度
    this.race = null;   //种族
    this.armyNum = 0;   //军队数量
    this.earmyNum = 0;   //军队数量
}

//战场
function Battle(clientA, clientB) {
    this.clients = {
        A: clientA || null,
        B: clientB || null
    };
    this.status = 1;    //游戏状态【0 -- 结束】【1 -- 进行中】
    this.stars = [];
    this.detects = {	//战争迷雾
        A: [],
        B: []
    };
    this.movements = {  //移动状态
        A: [],
        B: []
    };
    this.mainTimer = null,  //主游戏时间
    this.raceKnow = 0;  //是否探测到对方种族
    //初始化游戏
	this.initGame = function () {
	    var me = this;
	    var map = maps[0];
	    for (var i = 0; i < map.stars.length; i++) {
	        var star = new Star(map.stars[i].x, map.stars[i].y, i);
	        star.radius = config.radius[map.stars[i].size];
	        star.speed = config.speed[map.stars[i].size];
	        star.maxNum = config.maxNum[map.stars[i].size];
	        switch (map.stars[i].tag) {
	            case 'A':
	                star.armyNum['A'] = map.stars[i].num;
	                star.status = 1;
	                me.detects['A'].push(1);
	                me.detects['B'].push(0);
	                break;
	            case 'B':
	                star.armyNum['B'] = map.stars[i].num;
	                star.status = 2;
	                me.detects['A'].push(0);
	                me.detects['B'].push(1);
	                break;
	            case 'M':
	                star.armyNum['M'] = map.stars[i].num;
	                star.status = 4;
	                me.detects['A'].push(0);
	                me.detects['B'].push(0);
	                break;
	        }

	        me.stars.push(star);

	    }
	    for (var i = 0; i < map.paths.length; i++) {
	        me.movements['A'].push(0);
	        me.movements['B'].push(0);
	    }
	};
    //开始游戏
    this.startGame = function () {
        var me = this;
        me.initGame();
        console.log('客户端 [' + me.clients['A'].id + '] 与 客户端[' + me.clients['B'].id + '] 的游戏已经开始');
        var Adata = {
            type: 'INIT',
            side: 'A',
            eside: 'B',
            moveSpeed: me.clients['A'].moveSpeed,
            map: maps[0]
        }
        var Bdata = {
            type: 'INIT',
            side: 'B',
            eside: 'A',
            moveSpeed: me.clients['B'].moveSpeed,
            map: maps[0]
        }
        clientA.client.send('游戏开始！')
        clientB.client.send('游戏开始！')

        clientA.client.send(JSON.stringify(Adata));
        clientB.client.send(JSON.stringify(Bdata));
        this.mainTimer = setInterval(function () { me.gameControl(); }, 50);
        me.starActivtiy();
    };
    //游戏控制
    this.gameControl = function () {
        var me = this;
        me.clients['A'].armyNum = 0;
        me.clients['A'].earmyNum = 0;
        me.clients['B'].armyNum = 0;
        me.clients['B'].earmyNum = 0;
        for (var i = 0; i < me.stars.length; i++) {
            //控制星球状态
            var star = me.stars[i];
            //计算星球总军队
            star.totalNum = 0;
            for (var side in star.armyNum) {
                star.totalNum += star.armyNum[side];
            }
            //统计军队总数
            me.clients['A'].armyNum += star.armyNum['A'];
            if (me.detects['A'][i] == 1)
                me.clients['A'].earmyNum += star.armyNum['B'];
            me.clients['B'].armyNum += star.armyNum['B'];
            if (me.detects['B'][i] == 1)
                me.clients['B'].earmyNum += star.armyNum['A'];

            if (star.totalNum != 0) {
                if (star.armyNum['A'] == star.totalNum) {
                    star.status = 1;
                }
                else if (star.armyNum['B'] == star.totalNum) {
                    star.status = 2;
                }
                else if (star.armyNum['A'] != 0 && star.armyNum['B'] != 0) {
                    star.status = 3;
                }
            }
        }
        //传输中的军队数量
        for (var j = 0; j < me.movements['A'].length; j++) {
            me.clients['A'].armyNum += me.movements['A'][j];
            me.clients['B'].armyNum += me.movements['B'][j];
        }
        //游戏结束
        if ((me.clients['A'].armyNum == 0 || me.clients['B'].armyNum == 0)) {
            var Adata = {
                type: 'RESULT',
                content: null
            };
            var Bdata = {
                type: 'RESULT',
                content: null
            };
            if (me.clients['A'].armyNum != 0) {
                Adata.content = 'WIN';
                Bdata.content = 'LOSE';
            }
            else if (me.clients['B'].armyNum != 0) {
                Adata.content = 'LOSE';
                Bdata.content = 'WIN';
            }
            else {
                Adata.content = 'EVEN';
                Bdata.content = 'EVEN';
            }
            clearInterval(me.mainTimer);
            setTimeout(function () {
                me.status = 0;   //游戏结束
                me.clients['A'].client.send(JSON.stringify(Adata));
                me.clients['B'].client.send(JSON.stringify(Bdata));
                me.clients['A'].client.close();
                me.clients['B'].client.close();
            }, 500);
        }
        me.communicate();
    };
    //星球活动（生产/战争)
    this.starActivtiy = function () {
        var me = this;
		try{
        for (var i = 0; i < me.stars.length; i++)  //注意闭包的问题
        {
            var star = me.stars[i];
            (function (st) {
                //星球生产，按照星球生存速度
                if (me.clients['A'].race == 'Zygon') {         //Zygon种族特性
                    setInterval(function () {
                        if (st.status == 1 && st.armyNum['A'] < st.maxNum) {
                            st.armyNum['A']++;
                        }
                    }, st.speed * 1000 - 1000);
                } else if (me.clients['A'].race == 'Dalek')     //Dalek种族特性
                {
                    setInterval(function () {
                        if ((st.status == 1 && st.armyNum['A'] < st.maxNum) || (st.status == 3 && st.armyNum['A'] < st.maxNum)) {
                            st.armyNum['A']++;
                        }
                    }, st.speed * 1000);
                } else {
                    setInterval(function () {
                        if (st.status == 1 && st.armyNum['A'] < st.maxNum) {
                            st.armyNum['A']++;
                        }
                    }, st.speed * 1000);
                }
                if (me.clients['B'].race == 'Zygon') {
                    setInterval(function () {
                        if (st.status == 2 && st.armyNum['B'] < st.maxNum) {
                            st.armyNum['B']++;
                        }
                    }, st.speed * 1000 - 1000);
                } else if (me.clients['B'].race == 'Dalek') {
                    setInterval(function () {
                        if ((st.status == 2 && st.armyNum['B'] < st.maxNum) || (st.status == 3 && st.armyNum['B'] < st.maxNum)) {
                            st.armyNum['B']++;
                        }
                    }, st.speed * 1000);
                } else {
                    setInterval(function () {
                        if (st.status == 2 && st.armyNum['B'] < st.maxNum) {
                            st.armyNum['B']++;
                        }
                    }, st.speed * 1000);
                }

                //星球战斗，0.5s一次损耗
                setInterval(function () {
                    if (st.status == 3) {
                        if (st.armyNum['A'] > 0)
                            st.armyNum['A']--;
                        if (st.armyNum['B'] > 0)
                            st.armyNum['B']--;
                    }
                    if (st.armyNum['M'] > 0 && st.armyNum['M'] < st.totalNum) {
                        for (var side in st.armyNum) {
                            if (st.armyNum[side] > 0)
                                st.armyNum[side]--;
                        }
                    }
                }, 500);
            })(star)
        }
		}catch(e)
		{
			console.log('崩溃了又/' + e.message + '/' + e.description);
		}
    };
    //星球间移动
    this.move = function (msg, client) {
        var me = this;
        //移入传输队列
        if (me.stars[msg.from].armyNum[client.side] < msg.number)
            msg.number = me.stars[msg.from].armyNum[client.side];
        me.stars[msg.from].armyNum[client.side] -= msg.number;
        me.movements[client.side][msg.pathID] += msg.number;
        var moveTime = Math.ceil((msg.number * 1.0) / client.moveSpeed);
        setTimeout(function () {
            //移出队列，移入目标星球
            me.stars[msg.to].armyNum[client.side] += msg.number;
            me.movements[client.side][msg.pathID] -= msg.number;
            //探测到目标星球
            me.detects[client.side][msg.to] = 1;
        }, moveTime * 1000);
    };
    //主通信（每隔50ms发送一次数据包)
    this.communicate = function () {
        var me = this;
        var Adata = {
            type: 'MAIN',
            stars: [],
            armyNum: me.clients['A'].armyNum,
            earmyNum: me.clients['A'].earmyNum,
            movements: me.movements['A']
        };
        var Bdata = {
            type: 'MAIN',
            stars: [],
            armyNum: me.clients['B'].armyNum,
            earmyNum: me.clients['B'].earmyNum,
            movements: me.movements['B']
        };
        //探测到对方种族
        if (me.raceKnow == 0) {
            if (Adata.earmyNum > 0) {
                debugger;
                console.log('A get B');
                var rdata = {
                    type: 'ERACE',
                    content: me.clients['B'].race
                };
                me.clients['A'].client.send(JSON.stringify(rdata));
                me.raceKnow = 1;
            }
            if (Bdata.earmyNum > 0) {
                debugger;
                console.log('B get A');
                var rdata = {
                    type: 'ERACE',
                    content: me.clients['A'].race
                };
                me.clients['B'].client.send(JSON.stringify(rdata));
                me.raceKnow = 1;
            }
        }
        extend(Adata.stars, me.stars);  //深拷贝
        extend(Bdata.stars, me.stars);
        for (var i = 0; i < me.stars.length; i++) {
            switch (me.stars[i].status) {
                case 1:
                    {
                        Adata.stars[i].status = '占领';
                        Bdata.stars[i].status = '敌方';
                        break;
                    }
                case 2:
                    {
                        Bdata.stars[i].status = '占领';
                        Adata.stars[i].status = '敌方';
                        break;
                    }
                case 3:
                    {
                        Adata.stars[i].status = '交战';
                        Bdata.stars[i].status = '交战';
                        break;
                    }
                case 4:
                    {
                        Adata.stars[i].status = '中立';
                        Bdata.stars[i].status = '中立';
                    }
            }

            if (me.detects['A'][i] == 0) {
                Adata.stars[i].armyNum['A'] = 0;
                Adata.stars[i].armyNum['B'] = 0;
                Adata.stars[i].status = '未知';
            }
            if (me.detects['B'][i] == 0) {
                Bdata.stars[i].armyNum['A'] = 0;
                Bdata.stars[i].armyNum['B'] = 0;
                Bdata.stars[i].status = '未知';
            }
        }
        me.clients['A'].client.send(JSON.stringify(Adata));
        me.clients['B'].client.send(JSON.stringify(Bdata));
    };
}

//星球
function Star(x, y, id, r) {
    this.x = x;
    this.y = y;
    this.radius = r || 20;
    this.id = id;
    this.radius = 20;  //星球大小
    this.speed = 5;   //生产速度
    this.totalNum = 0; //军队数量
    this.armyNum = {  //军队数量
        A: 0,
        B: 0,
        M: 0
    };
    this.maxNum = 40;   //生产上线
    this.status = 4;   //星球状态【0 -- 未知】【1 -- A方】【2 -- B方】【3 -- 交战】【4 -- 中立】
};

//游戏地图
var maps = [{
    id: 0,
    name: '无主之地',
    stars: [{
        x: 10,
        y: 50,
        size: 2,
        num: 20,
        tag: 'A'
    }, {
        x: 20,
        y: 25,
        size: 0,
        num: 5,
        tag: 'M'
    }, {
        x: 22,
        y: 95,
        size: 0,
        num: 10,
        tag: 'M'
    }, {
        x: 45,
        y: 15,
        size: 1,
        num: 10,
        tag: 'M'
    }, {
        x: 50,
        y: 95,
        size: 0,
        num: 5,
        tag: 'M'
    }, {
        x: 70,
        y: 65,
        size: 0,
        num: 15,
        tag: 'M'
    }, {
        x: 80,
        y: 35,
        size: 0,
        num: 5,
        tag: 'M'
    }, {
        x: 90,
        y: 100,
        size: 2,
        num: 20,
        tag: 'B'
    }],
    paths: [
			{ connectStar: [0, 1] },
			{ connectStar: [0, 2] },
			{ connectStar: [2, 4] },
			{ connectStar: [4, 5] },
			{ connectStar: [5, 7] },
			{ connectStar: [7, 6] },
			{ connectStar: [6, 3] },
			{ connectStar: [3, 1] },
			{ connectStar: [3, 2] },
			{ connectStar: [3, 4] },
			{ connectStar: [3, 5] },
			{ connectStar: [5, 6] }
		]
}]

//======================【主进程】====================================================
var ws = require('ws').Server;
var server = new ws({ host: config.host, port: config.port });
//客户端连入服务器
server.on('connection', function (conn) {
    var conn_id = guidGenerator();
    console.log('客户端 [' + conn_id + '] 连接成功！目前已连入' + (Server.clients.length + 1) + '个客户端');
    var match = 0;
    //匹配对手
    for (var i = 0; i < Server.clients.length && match == 0; i++) {
        if (Server.clients[i].targetID == null) {
            Server.clients[i].targetID = conn_id;
            var client = new Client(conn, conn_id, Server.clients[i].id, 'B');
            Server.clients.push(client);
            //匹配成功
            var battle = new Battle(Server.clients[i], client);
            //1秒后进入游戏
            setTimeout(function () { battle.startGame(); }, 1000);
            Server.battles.push(battle);
            match = 1;
        }
    }
    if (match == 0) {
        conn.send('正在匹配中');
        Server.clients.push(new Client(conn, conn_id, null, 'A'));
    }
    //客户端消息（JSON格式）
    conn.on('message', function (data) {
        var msg = JSON.parse(data);
        var client = Server.clients[Server.getClientIndex(conn)];
        var battle = Server.battles[Server.getBattleIndex(conn)];
        var tarClient = Server.clients[Server.getClientIndexByID(client.targetID)];
        switch (msg.type) {
            case 'RACE':
                {
                    client.race = msg.content;
                    if (client.race == 'Tardis') //Tardis种族特性
                    {
                        client.moveSpeed = 10;
                    }
                    break;
                }
            case 'MOVE':
                {
                    battle.move(msg, client);
                    //若该动作对手可见
                    if (battle.detects[tarClient.side][msg.from] == 1 || battle.detects[tarClient.side][msg.to] == 1) {
                        var ndata = JSON.parse(JSON.stringify(msg));
                        ndata.type = 'EMOVE';
                        tarClient.client.send(JSON.stringify(ndata));
                    }
                    break;
                }


        }
    });
    //客户端断开连接
    conn.on('close', function () {
        var index = Server.getClientIndex(conn);
        var client = Server.clients[index];
        var targetID = client.targetID;

        if (targetID != null) {
            var tarClient = Server.clients[Server.getClientIndexByID(targetID)];
            tarClient.targetID = null;
            //删除战局
            var battle = Server.battles[Server.getBattleIndex(conn)];
            console.log('客户端 [' + battle.clients['A'].id + '] 与 客户端[' + battle.clients['B'].id + '] 的游戏已经结束');
            Server.battles.splice(index, 1);
            //删除客户端
            console.log('客户端 [' + client.id + '] 关闭连接');
            Server.clients.splice(index, 1);

            //若游戏未结束，对手获得胜利&断开对手连接
            if (battle.status == 1) {
                var data = {
                    type: 'RESULT',
                    content: 'LIEWIN'
                };
                clearInterval(battle.mainTimer);
                setTimeout(function () {
                    tarClient.client.send(JSON.stringify(data));
                    tarClient.client.close();
                }, 500);
            }
        }
        else {
            console.log('客户端 [' + client.id + '] 关闭连接');
            Server.clients.splice(index, 1);
        }
    });
});
console.log('【微星战争】游戏服务器正在运行...');






//===================【辅助方法】=================================================


//生成随机ID
function guidGenerator() {
    var S4 = function () {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    };
    return (S4() + S4() + S4() + S4() + S4() + S4() + S4() + S4());
}

function getType(o) {
    var _t;
    return ((_t = typeof (o)) == "object" ? o == null && "null" || Object.prototype.toString.call(o).slice(8, -1) : _t).toLowerCase();
}
//深度复制
function extend(destination, source) {
    for (var p in source) {
        if (getType(source[p]) == "array" || getType(source[p]) == "object") {
            destination[p] = getType(source[p]) == "array" ? [] : {};
            arguments.callee(destination[p], source[p]);
        }
        else {
            destination[p] = source[p];
        }
    }
}