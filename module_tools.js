module.exports = {
    processModules: function(moduleList) {
        let modules = [];
        moduleList.forEach(function (type) {
            if (type.moduleName == 'proxmox') {
                try {
                    prox = require('proxmox')(type.details.user, type.details.password, type.details.ip);
                    modules.prox = prox;
                    console.log('Proxmox Connected Successfully');
                } catch(err) {
    
                }
                
                //prox_tools.getClusterStatus(prox);
            } else if (type.moduleName == 'google') {
                file_tools.readJSONFile(type.details.credentials).then(function (content) {
                    google_tools.authorize(content, type.details, google_oauth);
                });
            } else if (type.moduleName == 'netgear') {
                ngrouter =  new NetgearRouter(type.details.password, type.details.user, type.details.host, type.details.port);
                ngrouter.discover().then(discovered => {
                    
                    console.log(discovered)
                }).catch(err => console.log(err));
            }
        });
        return modules;
    }
}