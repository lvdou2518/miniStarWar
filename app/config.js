/**
 * @author 张伟佩
 * @date 2015-03-03
 */
var config = (function () {

    // summary:
    //      配置文件
    var config =
	{
	    // 代理
	    ProxyUrl: "proxy.ashx?",

	    //WebSocket服务器地址
        ServerUrl: "ws://127.0.0.1:8000",

	    //标题
        title:"微星战争——即时策略对战游戏",

	    //版权
        copyright:"南京师范大学",

        //版本
        version:'v0.0.3'
	};
    return config;
})();