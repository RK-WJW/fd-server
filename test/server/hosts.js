/**
*@description hosts���� �󶨺��Ƴ�hosts
*
* ���⣺hostile��hosts�ļ�·��winϵͳ��Ҫ�޸��£����c:���ɣ�linuxû�Թ������������Ҳֻ�ܵ����������޸ģ������������첽�Ļ�����໥���������ҿ�hostile����ʵ�ֲ����ӣ��ɲο�����ʵ��һ����ĿǰΪ�˾�����������ȣ����˶���ȥ��������hosts����Ȼʹ��hostile��
*@updateTime 2014-02-20/10
*/
var hostile = require('hostile')
var queue = [];
var ing = false;

//set ����host��
function set(domain, ip) {
    queue.push(function (cb){
        hostile.set(ip || '127.0.0.1', domain, function (err) {
            if (err) {
                console.error(err)
            } else {
                console.log('set hosts successfully! ' + domain)
            }
            cb();
        });
    });
    deal();
}
//remove �Ƴ��󶨵�host����
function remove(domain, ip) {
    queue.push(function (cb){
        hostile.remove(ip || '127.0.0.1', domain, function (err) {
            if (err) {
                console.error(err)
            } else {
                console.log('remove hosts successfully! ' + domain)
            }
            cb();
        });
    });
    deal();
}

function deal(){
    // console.log(deal.ing);
    if(deal.ing){
        return;
    }
    deal.ing = true;
    
    var fn = queue.shift();
    if(fn){
        fn(function (){
            deal.ing = false;
            deal();
        });
    }else{
        deal.ing = false;
    }
}

exports.set = set;
exports.remove = remove;
