/**
* @author 张伟佩
* @date 2015-09-26
*/

//页面
var page = {

    //初始化
    init: function () {
        var me = this;
        me.setVersion();
        me.setTitle();
        me.setVersion();
        me.bindEvents();
        game.initGame();  //初始化游戏
        $('#game-prepare').hide();
        $('#game-control').hide();
    },

    //设置标题
    setTitle: function () {
        var me = this;
        $(document).attr("title", config.title);
        $("#header-content .header-title").text(config.title);
    },
    //设置版本
    setVersion: function () {
        var me = this;
        $("#version").text(config.version);
    },

    //请求全屏游戏
    fullScreen: function () {
        var me = this;
        // 判断各种浏览器，找到正确的方法
        var element = document.documentElement;
        if (element.requestFullscreen) {
            element.requestFullscreen();
        } else if (element.mozRequestFullScreen) {
            element.mozRequestFullScreen();
        } else if (element.webkitRequestFullscreen) {
            element.webkitRequestFullscreen();
        } else if (element.msRequestFullscreen) {
            element.msRequestFullscreen();
        }
    },

    //显示游戏准备
    showGamePrepare: function () {
        var me = this;
        $('#game-prepare').show();
        $('#game-prepare #status').html('');
        me.resizeGamePrepare();
    },

    //加载游戏准备页面
    resizeGamePrepare: function () {
        var me = this;
//      var winHeight = $(window).height();
//      var tarHeight = $('#game-prepare .content').height();
//      var span = winHeight > tarHeight ? (winHeight - tarHeight) / 2 : 0;
//      $('#game-prepare .content').css('margin-top', span);
    },

    //加载游戏结果页面
    resizeGameResult: function () {
        var me = this;
        var winHeight = $(window).height();
        var reHeight = $('#game-result .content').height() + 180;
        var span = winHeight > reHeight ? (winHeight - reHeight) / 2 : 0;
        $('#game-result .content').css('margin-top', span);
    },

    //绑定事件
    bindEvents: function () {
        var me = this;
        //开始游戏
        $('#startGame').click(function () {
            $('#main-menu').hide();
            $('#game-prepare #status').html('');
            me.showGamePrepare();
        });
        //开始匹配
        $('#startMatch').click(function () {
            var race = $('.race.active').attr('id'); 
            if (race) {
                if (race == 'Random') {
                    var index = parseInt(Math.random() * 2);
                    race = $('.race:eq(' + index + ')').attr('id');
                }
                user.race = race;
                $('#mine-info .race').attr('class', 'item race iconfont icon-' + race);  //切换头像
                $('#status').html('正在连接服务器...');
                game.connect();
            }
        });

        //选择种族
        $('.race-list .race').click(function () {
        	var race = $(this).attr('id');
            $('.race-list .race').removeClass('active');
            $('.cur-status .cur-race').attr('class','cur-race iconfont icon-' + race)
            $(this).addClass('active');
        });

        //选择地图
        $('.map-list .map').click(function () {
        	var map = $(this).attr('id');
            $('.map-list .map').removeClass('active');
            $('.cur-status').css('background-image','url(img/' + map + '.jpg)')
            $(this).addClass('active');
        });
        //返回主页
        $('#game-result #return').click(function () {
            $('.layer').hide();
            game.initGame();
            $('#game-area').show();
            $('#main-menu').show();
        });

        //再来一局
        $('#game-result #battle').click(function () {
            $('.layer').hide();
            game.initGame();
            $('#game-area').show();
            me.showGamePrepare();

        });
    }
};

//背景
var background = {

    ctx: null,

    entityArray: [],

    init: function (ctx) {
        var me = this;
        me.ctx = ctx;
        for (var x = 0; x < 100; x++) {
            me.entityArray.push(new Dot(ctx));
        }

        me.update();
    },

    update: function () {
        var me = this;
        if (me.entityArray.length < 100) {
            for (var x = me.entityArray.length; x < 100; x++) {
                me.entityArray.push(new Dot(me.ctx));
            }
        }

        me.entityArray.forEach(function (dot) {
            dot.Update();
        });

        me.entityArray = me.entityArray.filter(function (dot) {
            return dot.alive;
        });

        me.draw();
        requestAnimationFrame(function () { me.update() });
    },

    draw: function () {
        var me = this;
        game.clearLayer(0);
        me.entityArray.forEach(function (dot) {
            dot.Draw();
        });
    }
};

//用户
var user = {
    side: 'A',
    eside: 'B',
    race: null,
    armyNum: 0,
    earmyNum: 0,
    moveSpeed: 0
};

//游戏
var game = {
    layers: null,
    width: null,
    height: null,
    //移动
    move: {
        from: null,
        to: null,
        number: 0,
        pathID: null
    },
    //星球
    stars: [],
    //路径
    paths: [],


    //连接服务器
    connect: function () {
        var me = this;
        if (window['WebSocket']) {
            Server = new WebSocket(config.ServerUrl);
            Server.onopen = function (e) {
                $('#status').html('与服务器连接成功,正在匹配...');
                //向服务器发送种族信息
                var data = {
                    'type': 'RACE',
                    'content': user.race
                };
                Server.send(JSON.stringify(data));
            };
            Server.onmessage = function (e) {
                try {
                    var data = JSON.parse(e.data);
                    switch (data.type) {
                        case 'INIT':   //初始化游戏包
                            {
                                $('status').html('匹配成功，正在初始化游戏...');
                                user.side = data.side;
                                user.eside = data.eside;
                                user.moveSpeed = data.moveSpeed;
								//设置头像
								if(user.side == 'A')
								{
									$('#mine-info .user-pic').css('background-image','url(img/user1.png)');
									$('#enermy-info .user-pic').css('background-image','url(img/user2.png)');
								}else
								{
									$('#mine-info .user-pic').css('background-image','url(img/user2.png)');
									$('#enermy-info .user-pic').css('background-image','url(img/user1.png)');
								}
                                //初始化种族
                                $('#mine-info .race').attr('class', 'item race iconfont icon-' + user.race);
                                me.loadMap(data.map);
                                $('status').html('初始化成功，准备进入游戏...');
                                $('#game-prepare').hide();
                                setTimeout(function () {
                                    $('#game-control').show();
                                }, 1010);

                                break;
                            }
                        case 'ERACE': //探测到敌军种族
                            {
                                $('#enermy-info .race').attr('class', 'item race iconfont icon-' + data.content);
                                break;
                            }
                        case 'MAIN':  //核心数据
                            {
                                me.stars = data.stars;
                                user.armyNum = data.armyNum;
                                user.earmyNum = data.earmyNum;
                                me.refreshMap(data.movements);
                                me.refreshMain();
                                break;
                            }
                        case 'EMOVE':  //对手移动
                            {
                                me.showMovements(data);
                                break;
                            }
                        case 'RESULT': //比赛结果
                            {
                                me.over(data.content);
                                break;
                            }

                    }
                } catch (err) {
                    console.log(e.data);
                }
            };
            Server.onclose = function (e) {
                $('status').html('与服务器断开连接');
            };
            Server.onerror = function (e) {
                $('#status').html('匹配失败，无法连接至服务器...');
            }
        } else {
            alert('匹配失败，您的浏览器不支持WebSocket，请尝试更换其它浏览器重新开始游戏。');
        }
    },

    //初始化游戏
    initGame: function () {
        var me = this;
        var bg = document.getElementById('bg');
        var star = document.getElementById('star');
        var move = document.getElementById('move');
        var path = document.getElementById('path');
        var ui = document.getElementById('ui');

        me.width = bg.width = star.width = path.width = ui.width = move.width = $(window).width();
        me.height = bg.height = star.height = path.height = ui.height = move.height = $(window).height();

        me.layers = new Array();
        me.layers[0] = bg.getContext('2d');
        me.layers[1] = star.getContext('2d');
        me.layers[2] = path.getContext('2d');
        me.layers[3] = ui.getContext('2d');
        me.layers[4] = move.getContext('2d');

        //background.init(me.layers[0]); //初始化背景
    },

    //加载地图
    loadMap: function (map) {
        var me = this;
        me.stars = []; me.paths = [];
        for (var i = 0; i < map.paths.length; i++) {
            var sPoint = map.paths[i].connectStar[0];
            var ePoint = map.paths[i].connectStar[1];
            me.paths.push(new Path(sPoint, ePoint));
        }
    },

    //清空图层
    clearLayer: function (layerId) {
        var me = this;
        me.layers[layerId].clearRect(0, 0, this.width, this.height);
    },

    //刷新地图
    refreshMap: function (movements) {
        var me = this;
        me.clearLayer(1);
        me.clearLayer(2);
        for (var i = 0; i < me.stars.length; i++) {
            var star = me.stars[i];
            //星球位置转换
            var w = $(window).width();
            var h = $(window).height() - 150;
            star.x = star.x * 0.01 * w;
            star.y = star.y * 0.01 * h;
        }
        //绘制路径
        for (var i = 0; i < me.paths.length; i++) {
            var line = me.paths[i];
            var sPoint = line.sPoint;
            var ePoint = line.ePoint;
            var thick = line.thick;
            if (me.stars[sPoint].status == '未知' && me.stars[ePoint].status == '未知')
                continue;
            //            if (movements[i] != 0)  //传输中
            //                common.drawLine(me.layers[2], me.stars[sPoint].x, me.stars[sPoint].y, me.stars[ePoint].x, me.stars[ePoint].y, thick, '#27AE60');
            //            else
            common.drawLine(me.layers[2], me.stars[sPoint].x, me.stars[sPoint].y, me.stars[ePoint].x, me.stars[ePoint].y, thick, 'rgba(127,140,141,0.4)');
        }
        //绘制星球
        for (var i = 0; i < me.stars.length; i++) {
            var star = me.stars[i];
            common.drawStar(me.layers[1], user, star);
        }
    },

    //刷新主控制
    refreshMain: function () {
        var me = this;
        $('#mine-info .armyNum').html(user.armyNum);
        $('#enermy-info .armyNum').html(user.earmyNum);
    },

    //显示移动
    showMovements: function (data) {
        var me = this;
        var moveTime = Math.ceil((data.number * 1.0) / user.moveSpeed);
        var frmX = game.stars[data.from].x;
        var frmY = game.stars[data.from].y;
        var tarX = game.stars[data.to].x;
        var tarY = game.stars[data.to].y;
        var curX = frmX; var curY = frmY;
        var deltX = (tarX - frmX) / moveTime;
        var deltY = (tarY - frmY) / moveTime;
        var moveTimer = setInterval(function () {
            game.layers[4].clearRect(curX - 30, curY - 30, 60, 60);
            curX += (deltX * 0.02);
            curY += (deltY * 0.02);
            if (data.type == 'MOVE')
                common.drawCircle(game.layers[4], curX, curY, 15, common.colors['mine']);
            else
                common.drawCircle(game.layers[4], curX, curY, 15, common.colors['enermy']);
            common.drawText(game.layers[4], curX, curY, 15, data.number, 5)
            if (curX.toFixed(2) == tarX.toFixed(2) && curY.toFixed(2) == tarY.toFixed(2))
                clearInterval(moveTimer);
        }, 20);
    },

    //游戏结束
    over: function (result) {
        var me = this;
        $('#game-result').show();
        switch (result) {
            case 'WIN':
                $('#game-result .result').hide();
                $('#game-result #win').show();
                break;
            case 'LOSE':
                $('#game-result .result').hide();
                $('#game-result #lose').show();
                break;
            case 'EVEN':
                $('#game-result .result').hide();
                $('#game-result #even').show();
                break;
            case 'LIEWIN':
                $('#game-result .result').hide();
                $('#game-result #info').html('您的对手离开了游戏').show();
                $('#game-result #win').show();
                break;
        }
        page.resizeGameResult();
    }
};

$(function () {
    //窗体大小监听
    $(window).resize(function () {
        game.initGame();
        page.resizeGamePrepare();
        page.resizeGameResult();
    });
    //星球点击事件
    $('#star').mousedown(function (e) {
        var canvasPosition = $(this).offset();
        var mouseX = (e.pageX - canvasPosition.left) || 0;
        var mouseY = (e.pageY - canvasPosition.top) || 0;
        var i = onStar(mouseX, mouseY);
        if (i != -1) {
            var star = game.stars[i];
            game.move.from = i;
            //军队移动UI
            common.drawCircleBorder(game.layers[3], star.x, star.y, star.radius + 5);
            $('canvas#ui').show();
        }
    });
    $('#star').mousemove(function (e) {
        var canvasPosition = $(this).offset();
        var mouseX = (e.pageX - canvasPosition.left) || 0;
        var mouseY = (e.pageY - canvasPosition.top) || 0;
        var i = onStar(mouseX, mouseY);
        if (i != -1)
            $(this).css('cursor', 'pointer');
        else
            $(this).css('cursor', 'default');
    });

    //移动操作
    $('#ui').mousemove(function (e) {
        var canvasPosition = $(this).offset();
        var mouseX = (e.pageX - canvasPosition.left) || 0;
        var mouseY = (e.pageY - canvasPosition.top) || 0;
        //未选择终点
        if (game.move.to == null) {
            //清空画布
            game.clearLayer(3);
            //绘制连接线
            common.drawLine(game.layers[3], game.stars[game.move.from].x, game.stars[game.move.from].y, mouseX, mouseY, 10, '#27AE60');
            //绘制起点星球
            common.drawCircleBorder(game.layers[3], game.stars[game.move.from].x, game.stars[game.move.from].y, game.stars[game.move.from].radius + 2);
            common.drawStar(game.layers[3], user, game.stars[game.move.from]);
            var i = onStar(mouseX, mouseY);
            if (i != -1 && i != game.move.from) {
                $(this).css('cursor', 'pointer');
                //清空画布
                game.clearLayer(3);
                //绘制连接线
                common.drawLine(game.layers[3], game.stars[game.move.from].x, game.stars[game.move.from].y, game.stars[i].x, game.stars[i].y, 10, '#27AE60');
                //绘制起点星球
                common.drawCircleBorder(game.layers[3], game.stars[game.move.from].x, game.stars[game.move.from].y, game.stars[game.move.from].radius + 2);
                common.drawStar(game.layers[3], user, game.stars[game.move.from]);
                //绘制当前星球
                common.drawCircleBorder(game.layers[3], game.stars[i].x, game.stars[i].y, game.stars[i].radius + 2);
                common.drawStar(game.layers[3], user, game.stars[i]);
            }
            else {
                $(this).css('cursor', 'default');
            }
        }
        else {
            //清空画布
            game.clearLayer(3);
            //绘制连接线
            common.drawLine(game.layers[3], game.stars[game.move.from].x, game.stars[game.move.from].y, game.stars[game.move.to].x, game.stars[game.move.to].y, 10, '#27AE60');
            //绘制起点星球
            common.drawCircleBorder(game.layers[3], game.stars[game.move.from].x, game.stars[game.move.from].y, game.stars[game.move.from].radius + 2);
            common.drawStar(game.layers[3], user, game.stars[game.move.from]);
            //绘制终点星球
            common.drawCircleBorder(game.layers[3], game.stars[game.move.to].x, game.stars[game.move.to].y, game.stars[game.move.to].radius + 2);
            common.drawStar(game.layers[3], user, game.stars[game.move.to]);
            //面板背景
            var cx = (game.stars[game.move.from].x + game.stars[game.move.to].x) / 2;
            var cy = (game.stars[game.move.from].y + game.stars[game.move.to].y) / 2;
            common.drawCircle(game.layers[3], cx, cy, 50, common.colors['unknow']);
            //绘制面板
            var angle;
            if (mouseY == cy) {
                if (mouseX > cx) {
                    angle = Math.PI / 2;
                } else {
                    angle = Math.PI * 3 / 2;
                }
            }
            else if (mouseY > cy) {  //第二三象限
                angle = Math.atan((mouseX - cx) / (cy - mouseY));
                angle += Math.PI;
            }
            else if (mouseX < cx) {  //第四象限
                angle = Math.atan(Math.abs(mouseX - cx) / Math.abs(cy - mouseY));
                angle = Math.PI * 2 - angle;
            } else {                 //第一象限
                angle = Math.atan((mouseX - cx) / (cy - mouseY));
            }
            game.move.number = Math.round((angle / (Math.PI * 2)) * game.stars[game.move.from].armyNum[user.side]);
            common.drawSector(game.layers[3], cx, cy, 50, 0, angle, common.colors['mine']);
            common.drawText(game.layers[3], cx, cy, 50, game.move.number, 25);
        }
    });
    $('#ui').mouseup(function (e) {
        var canvasPosition = $(this).offset();
        var mouseX = (e.pageX - canvasPosition.left) || 0;
        var mouseY = (e.pageY - canvasPosition.top) || 0;
        if (game.stars[game.move.from].status != '未知' && game.move.to == null) {
            var i = onStar(mouseX, mouseY);
            if (i != -1 && i != game.move.from) {
                var status = false;
                //判断是否存在路径
                for (var j = 0; j < game.paths.length; j++) {
                    if ((game.paths[j].sPoint == game.move.from && game.paths[j].ePoint == i) || (game.paths[j].sPoint == i && game.paths[j].ePoint == game.move.from)) {
                        status = true;
                        game.move.pathID = j;
                        break;
                    }
                }
                if (!status) {
                    game.clearLayer(3);
                    game.move.from = null;
                    game.move.to = null;
                    $('canvas#ui').hide();
                }
                else {
                    game.move.to = i;
                    //面板背景
                    var cx = (game.stars[game.move.from].x + game.stars[game.move.to].x) / 2;
                    var cy = (game.stars[game.move.from].y + game.stars[game.move.to].y) / 2;
                    common.drawCircle(game.layers[3], cx, cy, 50, common.colors['unknow']);
                    //绘制面板
                    var angle;
                    if (mouseY == cy) {
                        if (mouseX > cx) {
                            angle = Math.PI / 2;
                        } else {
                            angle = Math.PI * 3 / 2;
                        }
                    }
                    else if (mouseY > cy) {  //第二三象限
                        angle = Math.atan((mouseX - cx) / (cy - mouseY));
                        angle += Math.PI;
                    }
                    else if (mouseX < cx) {  //第四象限
                        angle = Math.atan(Math.abs(mouseX - cx) / Math.abs(cy - mouseY));
                        angle = Math.PI * 2 - angle;
                    } else {                 //第一象限
                        angle = Math.atan((mouseX - cx) / (cy - mouseY));
                    }
                    game.move.number = parseInt((angle / (Math.PI * 2)) * game.stars[game.move.from].armyNum[user.side]);
                    common.drawSector(game.layers[3], cx, cy, 50, angle, game.move.number);
                }
            }
            else {
                game.clearLayer(3);
                game.move.from = null;
                game.move.to = null;
                $('canvas#ui').hide();
            }
        }
        else {
            game.clearLayer(3);
            game.move.from = null;
            game.move.to = null;
            $('canvas#ui').hide();
        }
    });
    $('#ui').mousedown(function (e) {
        if (game.move.to != null && game.move.number > 0) {
            //发送移动命令
            var data = {
                type: 'MOVE',
                from: game.move.from,
                to: game.move.to,
                pathID: game.move.pathID,
                number: game.move.number
            };
            Server.send(JSON.stringify(data));
            //移动效果
            game.showMovements(data);
        }
        game.clearLayer(3);
        $('canvas#ui').hide();
        game.move.from = null;
        game.move.to = null;
    });
    page.init();
});


//===========================【辅助】============================================================
//线
function Path(sp, ep, thick) {
    this.sPoint = sp;
    this.ePoint = ep;
    this.thick = thick;
};
//判断当前位置是否处在星球上
function onStar(x, y) {
    for (var i = 0; i < game.stars.length; i++) {
        var starX = game.stars[i].x;
        var starY = game.stars[i].y;
        var radius = game.stars[i].radius;
        if (Math.pow(x - starX, 2) + Math.pow(y - starY, 2) < Math.pow(radius, 2)) {
            return i;
        }
    }
    return -1;
};

function Dot(ctx) {
    this.alive = true;
    this.x = Math.round(Math.random() * game.width);
    this.y = Math.round(Math.random() * game.height);
    this.diameter = Math.random() * 7;
    this.colorIndex = Math.round(Math.random() * 3);
    this.colorArray = ['rgba(255,153,0,', 'rgba(66,66,66,', 'rgba(188,188,188,', 'rgba(50,153,187,'];
    this.alpha = 0.1;
    this.color = this.colorArray[this.colorIndex] + this.alpha + ')';

    this.velocity = { x: Math.round(Math.random() < 0.5 ? -1 : 1) * Math.random() * 0.7, y: Math.round(Math.random() < 0.5 ? -1 : 1) * Math.random() * 0.7 };
    this.ctx = ctx;
}

Dot.prototype = {
    Draw: function () {
        this.ctx.fillStyle = this.color;
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.diameter, 0, Math.PI * 2, false);
        this.ctx.fill();
    },

    Update: function () {
        if (this.alpha < 0.8) {
            this.alpha += 0.01;
            this.color = this.colorArray[this.colorIndex] + this.alpha + ')';
        }

        this.x += this.velocity.x;
        this.y += this.velocity.y;

        if (this.x > game.width + 5 || this.x < 0 - 5 || this.y > game.height + 5 || this.y < 0 - 5) {
            this.alive = false;
        }
    }
};
