var fs = require("fs");
var md5 = require("MD5");
var child_process = require('child_process');
var fileListen = false;
var vhosts = {
    module: "./test/server/vhosts",
    process: null,
    list: {}
};
var proxy = {
    module: "./test/server/proxy",
    process: null,
    list: []
};
//�������������ж���Щ�������ù������˱仯
var getNum = (function (){
        var n = 0;
        return function (){
            return ++n;
        };
    })();

//��ȡ������Ϣ������server/����server
function startup(path){
    fs.exists(path, function (t){
        if(t){
            //��Ӽ����ļ������¼�
            if(!fileListen){
                fs.watchFile(path,function (curr, prev){
                    if(curr.mtime > prev.mtime){
                        console.log("config file update~! " + path);
                        startup(path);
                    }
                });
                fileListen = true;
            }
            //��ȡ�ļ�����
            fs.readFile(path, {encoding: "utf8"}, function (err, data){
                if(err){
                    throw err;
                }
                eval('var obj = ' + data);
                
                //�������ݣ�Ȼ����·���
                if(dealData(obj)){
                    updateVhostsServer();
                    updateProxyServer();
                }
            });
        }else{
            console.warn("file not found. " + path);
        }
    });
    
    function dealData(data){
        if(data){
            var _n = getNum();//��ʶ���δ��������
            var vhostsCfg = data.vhosts;
            var proxyCfg = data.proxys;
            var i, item, domain, path;
            
            //����vhost��������
            for(i = 0; i < vhostsCfg.length; i++){
                item = vhostsCfg[i];
                domain = item.domain;
                path = item.path;
                vhosts.list[domain] = {
                    path: item.path,
                    port: item.port,
                    ext: item.ext,
                    _n: _n
                };
            }
            vhosts._latest = _n;
            
            //������������������
            proxy.list = [];
            for(i = 0; i < proxyCfg.length; i++){
                item = proxyCfg[i];
                proxy.list.push({
                    pattern: item.pattern,
                    responder: item.responder
                });
            }
            
            return true;
        }
        return false;
    } 
}

//���±��ؾ�̬����
function updateVhostsServer(){
    //vhosts�̴߳���
    vhosts.process = vhosts.process || child_process.fork(vhosts.module);
    vhosts.process.send({
        type: "update",
        options: [vhosts.list, vhosts._lastest]
    });
    vhosts.process.on("close", function(){
        console.log("vhosts.process closed~��");
    });
}

//���´������
function updateProxyServer(){
    //proxy�̴߳���
    proxy.process = proxy.process || child_process.fork(proxy.module);
    proxy.process.send({
        type: "update",
        options: [proxy.list]
    });
    proxy.process.on("close", function(){
        console.log("proxy.process closed~��");
    });
}

process.on('uncaughtException', function(err){
  console.error('uncaughtException: ' + err.message);
});

exports.start = init;