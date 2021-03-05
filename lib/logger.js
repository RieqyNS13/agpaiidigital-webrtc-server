const fs = require('fs').promises;
exports.toFile = function(filename,data){
    fs.appendFile(filename,data);
}