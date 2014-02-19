/**
*@description hosts���� �󶨺��Ƴ�hosts
* 
* ���⣺hostile��hosts�ļ�·��winϵͳ��Ҫ�޸��£����c:���ɣ�linuxû�Թ������������Ҳֻ�ܵ����������޸ģ������������첽�Ļ�����໥���������ҿ�hostile����ʵ�ֲ����ӣ��ɲο�����ʵ��һ����ĿǰΪ�˾�����������ȣ����˶���ȥ��������hosts����Ȼʹ��hostile��
*/
var hostile = require('hostile')
var queue = [];
var ing = false;

//set ����host��
function set(domain, ip) {
    if(ing){
        queue.push(function (){
            set(domain, ip);
        });
    }else{
        ing = true;
        hostile.set(ip || '127.0.0.1', domain, function (err) {
            if (err) {
                console.error(err)
            } else {
                console.log('set hosts successfully! ' + domain)
            }
            
            ing = false;
            var fn = queue.shift();
            if(typeof fn === "function"){
                fn();
            }
        });
    }
}
//remove �Ƴ��󶨵�host����
function remove(domain, ip) {
    if(ing){
        queue.push(function (){
            remove(domain, ip);
        });
    }else{
        hostile.remove(ip || '127.0.0.1', domain, function (err) {
            if (err) {
                console.error(err)
            } else {
                console.log('remove hosts successfully!' + domain)
            }
            
            ing = false;
            var fn = queue.shift();
            if(typeof fn === "function"){
                fn();
            }
        });
    }
}

exports.set = set;
exports.remove = remove;
