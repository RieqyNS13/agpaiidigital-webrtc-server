const fs = require('fs').promises;
async function test(filename, ...data){
    // console.log(data);
    const date = new Date();
    fs.appendFile('file1.txt',  date+' -> '+data+"\r\n")
}

test('asu.txt','hasil:',[1,2]); // test