/**
* @author 张伟佩
* @date 2015-03-03
*/
var common = (function () {

    // summary:
    //      通用方法
    var common =
	{
	    colors: {
	        mine: '#27AE60',
	        enermy: '#C0392B',
	        middle: '#f39c12',
	        unknow: '#7f8c8d'
	    },
	    // 画圆
	    drawCircle: function (ctx, x, y, r, color) {
	        ctx.shadowOffsetX = 5;
	        ctx.shadowOffsetY = 5;
	        ctx.shadowColor = '#333';
	        ctx.shadowBlur = 1.0;
	        r = r || 20;
	        ctx.fillStyle = color;
	        ctx.beginPath();
	        ctx.arc(x, y, r, 0, Math.PI * 2);
	        ctx.closePath();
	        ctx.fill();
	    },
	    //画线
	    drawLine: function (ctx, x1, y1, x2, y2, thick, color) {
	        color = color || 'gray';
	        ctx.beginPath();
	        ctx.moveTo(x1, y1);
	        ctx.lineTo(x2, y2);
	        ctx.lineWidth = thick || 10;
	        ctx.strokeStyle = color;
	        ctx.stroke();
	    },
	    //画圆边线
	    drawCircleBorder: function (ctx, x, y, r) {
	        ctx.beginPath();
	        ctx.arc(x, y, r, 0, Math.PI * 2, false);
	        ctx.closePath();
	        ctx.lineWidth = 5;
	        ctx.strokeStyle = 'red';
	        ctx.stroke();
	    },
	    //判断直线是否相交
	    isIntersect: function (line1, line2) {
	        var a1 = line1.ePoint.y - line1.sPoint.y;
	        var b1 = line1.sPoint.x - line1.ePoint.x;
	        var c1 = a1 * line1.sPoint.x + b1 * line1.sPoint.y;

	        var a2 = line2.ePoint.y - line2.sPoint.y;
	        var b2 = line2.sPoint.x - line2.ePoint.x;
	        var c2 = a2 * line2.sPoint.x + b2 * line2.sPoint.y;

	        var d = a1 * b2 - a2 * b1;

	        if (d == 0) {
	            return false;
	        } else {
	            var x = (c1 * b2 - c2 * b1) / (a1 * b2 - a2 * b1);
	            var y = (c1 * a2 - c2 * a1) / (b1 * a2 - b2 * a1);
	        }

	        //检测交点是否在线段上
	        if ((this.isBetween(line1.sPoint.x, x, line1.ePoint.x) || this.isBetween(line1.sPoint.y, y, line1.ePoint.y)) && (this.isBetween(line2.sPoint.x, x, line2.ePoint.x) || this.isBetween(line2.sPoint.y, y, line2.ePoint.y)))
	            return true;
	        return false;
	    },
	    //判断点是否在两点中
	    isBetween: function (a, b, c) {
	        if (Math.abs(a - b) < 0.00001 || Math.abs(b - c) < 0.00001)
	            return false;
	        return (a < b && b < c) || (c < b && b < a);
	    },
	    //绘制扇形
	    drawSector: function (ctx, x, y, r, sAngle, eAngle, color) {
	        var me = this;
	        ctx.shadowOffsetX = 0;
	        ctx.shadowOffsetY = 0;
	        ctx.shadowColor = 'rgba(100,100,100,0.5)';
	        ctx.shadowBlur = 1.5;
	        ctx.beginPath();
	        ctx.fillStyle = color;
	        ctx.arc(x, y, r, -Math.PI / 2 + sAngle, -Math.PI / 2 + eAngle);
	        ctx.lineTo(x, y);
	        ctx.fill();
	    },
	    //绘制文字
	    drawText: function (ctx, x, y, r, text, fontSize) {
	        var me = this;
	        ctx.shadowOffsetX = 0;
	        ctx.shadowOffsetY = 0;
	        ctx.font = fontSize + 'px Microsoft Yahei';
	        ctx.fillStyle = '#DDD';
	        ctx.textAlign = 'center';
	        ctx.textBaseline = 'middle';
	        ctx.fillText(text.toString(), x, y);
	    },
	    //绘制星球
	    drawStar: function (ctx, user, star) {
			var me = this;
	        ctx.shadowOffsetX = 5;
	        ctx.shadowOffsetY = 5;
	        ctx.shadowColor = 'rgba(51,51,51,0.5)';
	        ctx.shadowBlur = 1.0;
	        me.drawCircle(ctx, star.x, star.y, star.radius, me.colors['unknow']);
	        if (star.status == '未知') {
	            return;
	        }
	        if (star.totalNum == 0) {
	            if (star.status == '中立') {
	                me.drawCircle(ctx, star.x, star.y, star.radius, me.colors['middle']);
	            }
	            else if (star.status == '敌方')
	                me.drawCircle(ctx, star.x, star.y, star.radius, me.colors['enermy']);
                else {
	                me.drawCircle(ctx, star.x, star.y, star.radius, me.colors['mine']);
	            }
	        } else {
	            var angleMine = star.armyNum[user.side] / star.totalNum * Math.PI * 2;
	            var angleEnermy = star.armyNum[user.eside] / star.totalNum * Math.PI * 2 + angleMine;
	            var angleMiddle = star.armyNum['M'] / star.totalNum * Math.PI * 2 + angleEnermy;
	            me.drawSector(ctx, star.x, star.y, star.radius, 0, angleMine, me.colors['mine']);
	            me.drawSector(ctx, star.x, star.y, star.radius, angleMine, angleEnermy, me.colors['enermy']);
	            me.drawSector(ctx, star.x, star.y, star.radius, angleEnermy, angleMiddle, me.colors['middle']);
	        }
	        //显示军队数量  优先级：我军>敌军>中立
	        if (star.armyNum[user.side] > 0)
	            me.drawText(ctx, star.x, star.y, star.radius, star.armyNum[user.side], star.radius / 2 + 4);
	        else if (star.armyNum[user.eside] > 0)
	            me.drawText(ctx, star.x, star.y, star.radius, star.armyNum[user.eside], star.radius / 2 + 4);
	        else
	            me.drawText(ctx, star.x, star.y, star.radius, star.armyNum['M'], star.radius / 2 + 4);
	    }
	};
    return common;
})();