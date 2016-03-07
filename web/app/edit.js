/**
* @author 张伟佩
* @date 2015-09-26
*/
//对象
//星球
function Star(x, y, id, r) {
    this.x = x;
    this.y = y;
    this.radius = r || 20;
    this.id = id;
    this.speed = 5;   //生产速度
    this.totalNum = 0; //军队数量
    this.ANum = 0;   //A军数量
    this.BNum = 0;   //B军数量
    this.status = 0;   //星球状态【0 -- 未知】【1 -- A方】【2 -- B方】【3 -- 交战】【4 -- 中立】
};
//线
function Line(sp, ep, thick) {
    this.sPoint = sp;
    this.ePoint = ep;
    this.thick = thick;
}

//页面
var page = {
    //初始化
    init: function () {
        var me = this;
        me.setCopyright();
        me.setTitle();
        me.bindEvents();
        me.getLocation();
        $('#game-prepare').hide();
        $('#game-game').hide();
    },

    //设置标题
    setTitle: function () {
        var me = this;
        $(document).attr("title", config.title);
        $("#header-content .header-title").text(config.title);
    },
    //设置版权
    setCopyright: function () {
        var me = this;
        $("#copyright span").text(config.copyright);
    },

    //绑定事件
    bindEvents: function () {
        var me = this;
        $('#startGame').click(function () {
            $('#main-menu').hide();
            $('#game-prepare').show();
        });
        $('#startMatch').click(function () {
            $('#game-prepare').hide();
            $('#game-game').show();
        });
    },

    //获取位置
    getLocation: function () {
        var me = this;

    }
};

//用户
var user = {
    id: 'A',
    armyNum: 20
}

//游戏
var game = {
    layers: null,
    width: null,
    height: null,
    targetStar: null,
    stars: [],
    lines: [],
    background: null,
    init: function () {

        var bg = document.getElementById('bg');
        var star = document.getElementById('star');
        var path = document.getElementById('path');
        var ui = document.getElementById('ui');

        bg.width = star.width = path.width = ui.width = $('#bg').width();
        bg.height = star.height = path.height = ui.height = $('#bg').height();

        this.layers = new Array();
        this.layers[0] = bg.getContext('2d');
        this.layers[1] = star.getContext('2d');
        this.layers[2] = path.getContext('2d');
        this.layers[3] = ui.getContext('2d');

        this.width = $(document.getElementById('bg')).width();
        this.height = $(document.getElementById('bg')).height();

        this.drawBG();
        //this.loadMap();
        //this.refresh();
    },
    //绘制背景
    drawBG: function () {
        var ctx = this.layers[0];
        var grad = ctx.createRadialGradient(this.width / 2, this.height / 2, 50, this.width / 2, this.height / 2, this.height);
        grad.addColorStop(0, '#666');
        grad.addColorStop(1, '#000');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, this.width, this.height);
    },
    //加载地图
    loadMap: function () {
        for (var i = 0; i < common.maps[0].stars.length; i++) {
            this.stars.push(new Star(common.maps[0].stars[i].x, common.maps[0].stars[i].y));
        }
        for (var i = 0; i < common.maps[0].paths.length; i++) {
            var sPoint = this.stars[common.maps[0].paths[i].connectStar[0]];
            var ePoint = this.stars[common.maps[0].paths[i].connectStar[1]];
            this.lines.push(new Line(sPoint, ePoint));
        }
    },
    //随机生成圆
    createStars: function (starNum, starRadius) {
        starNum = starNum || 8;
        starRadius = starRadius || 10;
        for (var i = 0; i < starNum; i++) {
            var x = Math.random() * this.width;
            var y = Math.random() * this.height;
            this.stars.push(new Star(x, y, starRadius));
        }
    },
    //生成连接圆的线
    createLines: function () {
        this.lines.length = 0;
        for (var i = 0; i < this.stars.length; i++) {
            var sPoint = this.stars[i];
            var thick = 1;
            for (var j = 0; j < i; j++) {
                var ePoint = game.stars[j];
                this.lines.push(new Line(sPoint, ePoint, thick));
            }
        }
    },
    //清空
    clear: function () {
        this.layers[1].clearRect(0, 0, this.width, this.height);
        this.layers[2].clearRect(0, 0, this.width, this.height);
    },
    //游戏主循环
    refresh: function () {
        this.clear();
        for (var i = 0; i < this.lines.length; i++) {
            var line = this.lines[i];
            var sPoint = line.sPoint;
            var ePoint = line.ePoint;
            var thick = line.thick;
            var color = '#fff';
            for (var j = 0; j < this.lines.length; j++) {
                if (common.isIntersect(this.lines[i], this.lines[j])) {
                    color = '#1abc9c';
                    break;
                }
            } debugger;
            common.drawLine(this.layers[2], sPoint, ePoint, thick, color);
        }
        for (var i = 0; i < this.stars.length; i++) {
            var star = this.stars[i];
            common.drawCircle(this.layers[1], star.x, star.y, star.radius);
        }
    }
};

$(function () {
    //窗体大小监听
    $(window).resize(function () {
    });
    //鼠标监听事件
    $('#star').mousedown(function (e) {
        var canvasPosition = $(this).offset();
        var mouseX = (e.pageX - canvasPosition.left) || 0;
        var mouseY = (e.pageY - canvasPosition.top) || 0;
        for (var i = 0; i < game.stars.length; i++) {
            var starX = game.stars[i].x;
            var starY = game.stars[i].y;
            var radius = game.stars[i].radius;
            if (Math.pow(mouseX - starX, 2) + Math.pow(mouseY - starY, 2) < Math.pow(radius, 2)) {
                $(this).css('cursor', 'pointer');
                var star = game.stars[i];
                //更新星球信息
                $('#star-info .status .content').html(star.status);
                $('#star-info .speed .content').html(star.speed + '秒/人');
                $('#star-info .totalNum .content').html(star.totalNum);
                var myNum; var enemyNum;
                if (user.id == 'A') {
                    myNum = star.Anum;
                    enemyNum = star.Bnum;
                }
                else {
                    myNum = star.Bnum;
                    enemyNum = star.Anum;
                }
                $('#star-info .myNum .content').html(myNum);
                $('#star-info .enemyNum .content').html(enemyNum);
                //选择星球信息
                game.targetStar = i;
                break;
            }
        }
    });
    $('#star').mousemove(function (e) {
        if (game.targetStar != null) {
            var canvasPosition = $(this).offset();
            var mouseX = (e.pageX - canvasPosition.left) || 0;
            var mouseY = (e.pageY - canvasPosition.top) || 0;
            var radius = game.stars[game.targetStar].radius;
            game.stars[game.targetStar] = new Star(mouseX, mouseY, radius);
        }
        //game.createLines();
        game.refresh();
    });
    $('#star').mouseup(function (e) {
        game.targetStar = null;
        $(this).css('cursor', 'default');
    });
    //界面&游戏初始化
    page.init();
    game.init();

});
