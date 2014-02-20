/**
*@description ���ؾ�̬����
*@updateTime 2014-02-20/10
*/

var SS = require('node-static');
var http = require('http');
var route = require("./route");

var routeList = {};//·���б� keyΪdomain valueΪport
var staticPaths = {};//��ſ�����server����,keyΪpath
//�������������ж���Щ�������ù������˱仯
var getNum = (function (){
        var n = 0;
        return function (){
            return ++n;
        };
    })();
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
function vhosts(type, options){
    var fn = {
        // "start": startServer,
        // "exit": exit,
        // "restart": startServer,
        "update": update
    };
    fn[type] && fn[type].apply(null,options);
}

/**
*@description ����һ��server ���ؼ����Ķ˿ں�
*@param path {String}: ��Ҫ����������ļ�·������ѡ
*       port {Number}: �˿ںţ���ѡ
*       options {Object}: ��չ����
*@return {Object}: {
*           port: ,
*           path: ,
*           server: 
*        }
*/
function startServer(path, port, options){
    var port = port || getPort();//�˿�
    
    //����server
    var fileServer = new SS.Server(path, options);
    var server = http.createServer(function (request, response) {
        request.addListener('end', function () {
            fileServer.serve(request, response, function (err, result) {
                if(err){
                    response.writeHead(err.status, err.headers);
                    response.end();
                }
            });
        }).resume();
    });
    
    server.listen(port);
    console.log("Server runing at port: " + port + ". path: " + path);
    server.on("close", function (){
        console.log("static server closed~! " + path);
    });
    return {
        path: path,
        port: port,
        server: server
    };
}

/**
*@description ����/���·���
*@param list {Array} Ҫ�����ķ����б�
*/
function update(list){
    if(list && list instanceof Array && list.length > 0){
        var cur_n = getNum(), i = 0, item, path, domain, result;
        routeList = {};//��ʼ·���б�
        
        for(; i < list.length; i++){
            item = list[i];
            path = item.path;
            domain = item.domain;
            
            //ͨ��·���жϣ���·���Ƿ�����ѿ����˾�̬����
            //�����ڣ����ʶ��������ָ����ӵ�·���б��У�
            //�������ڣ�����һ����Ȼ�󱣴桢��ʶ��������ָ����ӵ�·���б���
            if(path && domain){
                if(staticPaths[path]){
                    staticPaths[path]._n = cur_n;
                    routeList[domain] = staticPaths[path].port;
                }else{
                    result = startServer(path);
                    if(!result || result.err){
                        console.warn("static-server start fail~! path: " + path + ", port: " + port + ", err: " + err);
                    }else{
                        result._n = cur_n;
                        staticPaths[path] = result;
                        routeList[domain] = result.port;
                    }
                }
            }
            
            //�����·�ɷ�����Ҫָ�������Ͷ˿ڡ�
            if(item.onlyRoute){
                routeList[domain] = item.port;
            }
            
        }
        //��������·�ɷ���
        routeStart();
        
        //�ر��������Ҫ�ķ���
        var _paths = {};
        for(var k in staticPaths){
            item = staticPaths[k];
            if(item._n === cur_n){
                _paths[k] = item;
            }else{
                close(item.server);
            }
        }
        staticPaths = _paths;
    }else{
        close();
    }
}

//����/���� ·��
function routeStart(){
    route.start(routeList);
}

/**
*@description �رշ���
*@param server {Server} ��Ҫ�رյķ��� ��ѡ
*/
function close(server){
    if(server){
        server.close();
    }else{
        var ports = "";
        for(var k in staticPaths){
            staticPaths[k].server.close();
            ports += staticPaths[k].port + ",";
        }
        staticPaths = {};
        
        var rlist = routeList;
        routeList = {};
        for(var k in rlist){
            if(! new RegExp(rlist[k]+",").test(ports)){
                routeList[k] = rlist[k];
            }
        }
        routeStart();
    }
}

function exit(){
    route.exit();
}

process.on("message", function (m){
    console.log("vhosts " + m.type);
    vhosts(m.type, m.options);
});

process.on('SIGINT', function() {
  console.log("The vhosts process will be exit~!");
  exit();
  setTimeout(function (){
    console.log("The vhosts process has exited~!");
    process.exit();
  }, 500);
});

// exports.vhosts = vhosts;