const fs = require('fs');
const path = require('path');
const dataPath = require('../../config.json').dataPath;

module.exports = Storage;

function Storage(name) {
  this.storageName = path.basename(name);
  this.path = path.join(dataPath, this.storageName);
  let lock = Promise.resolve();
  let reading = {};

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

  this.save = function (name = 'data', data, clobber = false) {
    name = path.basename(name);
    if(clobber) {
      reading[name] = false;
      lock = lock.then(() => _write(path.join(this.path, `${name}.json`), data));
      return lock;
    } else {
      return this.read(name).then(oldData => this.save(name, Object.assign(oldData, data), true));
    }
  };

  this.read = function (name = 'data') {
    name = path.basename(name);
    if(!reading[name]) {
      reading[name] = true;
      lock = lock.then(() => _read(path.join(this.path, `${name}.json`), name));
    }
    return lock;
  };
  
  function _write(path, data) {
    return new Promise(resolve =>
      fs.writeFile(path, JSON.stringify(data), (err) => {
        err && console.log('Problem Saving: ', err);
        resolve();
      })
    )
  }

  function _read(path, name) {
    return new Promise(resolve => {
      fs.readFile(path, (err, data) => {
        if(err) {
          console.log('Problem Reading: ', err);
          data = '{}';
        }
        resolve(JSON.parse(`${data}`));
        reading[name] = false;
      })
    })
  }

  this.init();
}