var SS = require('node-static');
var http = require('http');
var route = require("./route");

var serverMap = {};//��ſ�����server����,keyΪpath
var routeList = {};//·���б� keyΪdomain valueΪport

/**
*@description �������һ��δ��ռ�õĶ˿ں�
*@return һ��δ��ռ�õĶ˿ں�
*   �˿��Ƿ�ռ��Ŀǰ��֪�����ʵ�֣���˲�δ��֤��Ŀǰ���ɵĶ˿ڷ�Χ��8000~9000
*/
function getPort(){
    return parseInt(Math.random()*1000+8000);
}

/**
*@description vhosts��ڷ���
*/
function vhosts(methodName, options){
    var fn = {
        // "start": startServer,
        // "close": close,
        // "restart": startServer,
        "update": update
    };
    fn[methodName] && fn[methodName].apply(null,options);
}

/**
*@description ����һ��server ���ؼ����Ķ˿ں�
*@param options {Object}: {
*                   path: "����·��",
*                   domain: "����",
*                   ext: {} //������չ���� ��ѡ
*                }
*       flag {Boolean}: true/false �Ƿ�Ҫ����/����·�ɣ�Ĭ��true
*@return port ��������Ķ˿ں�
*/
function startServer(options, flag){
    var port = options.port;//�˿�
    var path = options.path;//·��
    var domain = options.domain;//����
    var obj = serverMap[path] || {};
    var flag = typeof flag === "undefined" || flag;
    
    //�Ƿ�ָ���˿ڣ�û��������һ��
    port = obj.port || port || getPort();
    
    if(!obj.server){
        //����server
        var fileServer = new SS.Server(path, options.ext);
        var server = http.createServer(function (request, response) {
            request.addListener('end', function () {
                fileServer.serve(request, response, function (err, result) {
                    if(err){
                        response.writeHead(err.status, err.headers);
                        response.end();
                    }
                });
            }).resume();
        }).listen(port); 
        console.log("Server runing at port: " + port + ". path: " + path);
        
        //��������server��������map��
        obj.server = server;
        obj.path = path;
        obj.port = port;
        obj.domains = "";
        obj.ext = options.ext;
        serverMap[path] = obj;
    }
    if(obj.domains.indexOf(domain) === -1){
        obj.domains = obj.domains + domain + ";";
    }
    routeList[domain] = port;
    console.log(domain + ": "+ port);
    flag ? routeStart() : '';
    return port;
}

/**
*@description ����/���·���
*@param list {Array} Ҫ�����ķ����б�
*/
function update(list){
    if(list && list instanceof Array){
        //������Ҫ���ѿ�������ر�
        var listStr = JSON.stringify(list);
        for(var path in serverMap){
            if(listStr.indexOf(path) === -1){
                close(path);
            }
        }
        
        routeList = {};
        //ѭ����������
        for(var i = 0; i < list.length; i++){
            var item = list[i];
            startServer(item, false);
        }
    }
    //����·�ɷ���
    routeStart();
}

//����/���� ·��
function routeStart(){
    route.start(routeList);
}

/**
*@description �رշ���
*@param path {String} ��Ҫ�رյķ���·�� 
*/
function close(path){
    if(path && serverMap[path] && serverMap[path].server){
        serverMap[path].server.close();
        delete serverMap[path];
    }
}

process.on("message", function (m){
    vhosts(m.method, m.options);
});

exports.vhosts = vhosts;