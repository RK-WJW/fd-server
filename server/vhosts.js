var SS = require('node-static');
var http = require('http');
var route = require("./route");
var hosts = require("./hosts");

var serverMap = {};//��ſ�����server����
var routeList = {};//·���б�

//�������һ��δ��ռ�õĶ˿ں�
function getPort(){
    /** ���ɶ˿ں� ��δ��֤�Ƿ�ռ�� */
    return parseInt(Math.random()*1000+8000);
}

function vhosts(methodName, options){
    var fn = {
        "start": startServer,
        "batchStart": batchStart,
        "close": closeServer,
        "restart": startServer
    };
    console.log(methodName);
    fn[methodName] && fn[methodName].apply(null,options);
}

//����һ��server ���ؼ����Ķ˿ں�
function startServer(options, flag){
    var port = options.port;//�˿�
    var path = options.path;//·��
    var domain = options.domain;//����
    var obj = serverMap[path] || {};
    var flag = typeof flag === "undefined" || flag;
    
    //�ж��Ƿ��Ѿ�������ָ��������server�����������ж������Ƿ���ȫ��ͬ��ͬ��ֱ�ӷ��أ�����ر�����һ��
    /* if(obj){
        //�ݲ�����˿��޸�
        if(!port || port == obj.port){
           port = obj.port;
        }else{
            closeServer(obj);
            obj.server = null;
        }
    } */
    
    
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
        
        //��������server��������map��
        obj.server = server;
        obj.path = path;
        obj.port = port;
        obj.domains = {};
        obj.ext = options.ext;
        serverMap[path] = obj;
        console.log("Server runing at port: " + port + ". path: " + path);
    }
    obj.domains[domain] = 1;
    routeList[domain] = port;
    flag ? routeStart() : '';
    hosts.set(domain);//��hosts
    return port;
}

function batchStart(list){
    if(list && list instanceof Array){
        for(var i = 0; i < list.length; i++){
            var item = list[i];
            var port = startServer(item, false);
            port ? routeList[item["domain"]] = port : '';
        }
    }
    routeStart();
}

//����/���� ·��
function routeStart(){
    route.start(routeList);
}

//�ر�server
function closeServer(options){
    var server = options["server"] || serverMap[options["path"]];
    if(server){
        server.close();
    }
    hosts.remove(domain);
    route.remove(domain);
}



process.on("message", function (m){
    vhosts(m.method, m.options);
});

exports.vhosts = vhosts;