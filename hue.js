var api_tools = require('./api_tools.js');

module.exports = {
    getAllLights: async function(modules) {
        var baseHost = 'http://' + modules.hue.ip;
        var basePath = '/api/' + modules.hue.username;
        var urlBase = baseHost + basePath;
        var url = urlBase + '/lights';
        var lights = await api_tools.getRestHttp(url);
        return lights;
    },
    getLight: async function (modules, lightID) {
        var baseHost = 'http://' + modules.hue.ip;
        var basePath = '/api/' + modules.hue.username;
        var urlBase = baseHost + basePath;
        var url = urlBase + '/lights/' + lightID;
        var light = await api_tools.getRestHttp(url);
        return light;
    },
    setLightState: async function (modules, lightID, state) {
        var baseHost = modules.hue.ip;
        var basePath = '/api/' + modules.hue.username;
        var path = basePath + '/lights/' + lightID + "/state";
        var body =  JSON.stringify({on:state});
        await api_tools.putRestHttp(baseHost, path, body);
        //return succ;
    }
}