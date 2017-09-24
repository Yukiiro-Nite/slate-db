const fs = require('fs');
const path = require('path');
const dataPath = require('../../config.json').dataPath;

module.exports = Storage;

function Storage(name) {
  this.storageName = name;
  this.path = path.join(dataPath, name);
  let lock = Promise.resolve();
  let reading = false;

  this.init = function () {
    if(!fs.existsSync(this.path)) {
      console.log(`${this.path} does not exist, creating dir`);
      lock = new Promise(resolve => {
        fs.mkdir(this.path, (err) => {
          err && console.log('Problem creating dir: ', err);
          resolve();
        });
      });
    }
  };

  this.save = function (name, data, clobber = false) {
    reading = false;
    lock = lock.then(() => new Promise( resolve =>
      fs.writeFile(path.join(this.path, 'data.json'), JSON.stringify(data), (err) => {
        err && console.log('Problem Saving: ', err);
        resolve();
      })
    ));
    return lock;
  };

  this.read = function (name) {
    if(!reading) {
      reading = true;
      lock = lock.then(() => new Promise(resolve => {
        console.log('trying to read file');
        fs.readFile(path.join(this.path, 'data.json'), (err, data) => {
          err && console.log('Problem Reading: ', err);
          resolve(JSON.parse(`${data}`));
          reading = false;
        })
      }));
    }
    return lock;
  };

  this.init();
}