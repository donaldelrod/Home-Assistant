module.exports = {
    getClusterStatus: function(prox) {
        prox.getClusterStatus(function(err, response){
            if(err) throw err;
            else{
              data = JSON.parse(response);
              console.log(data);
            }
        });
    }
};