const fs = require('fs');
const path = require('path');
const dataPath = require('../../config.json').dataPath;

module.exports = Storage;

function Storage(name) {
  this.storageName = path.basename(name);
  this.path = path.join(dataPath, this.storageName);
  let startLock = Promise.resolve();
  let lock = {};
  let reading = {};
  let internalId = 0;

  function getLock(name) {
    return lock[name] || startLock; 
  }
  
  function getID() {
    return internalId++;
  }
  
  this.init = function () {
    if(!fs.existsSync(this.path)) {
      console.log(`${this.path} does not exist, creating dir`);
      startLock = startLock.then(() => new Promise(resolve => {
        fs.mkdir(this.path, (err) => {
          err && console.log('Problem creating dir: ', err);
          resolve();
        });
      }));
    }
  };

  this.save = function (name = 'data', data) {
    name = path.basename(name);
    
    reading[name] = false;
    lock[name] = getLock(name).then(() => _write(path.join(this.path, `${name}.json`), data));
    return lock[name];
  };

  this.read = function (name = 'data') {
    name = path.basename(name);
    if(!reading[name]) {
      reading[name] = true;
      lock[name] = getLock(name).then(() => _read(path.join(this.path, `${name}.json`), name));
    }
    return lock[name];
  };
  
  function _write(path, data) {
    const id = getID();
    console.log(`[${id}] Setting up write for ${path}`);
    return new Promise(resolve => {
      console.log(`[${id}] Starting write for ${path}`);
      fs.writeFile(path, JSON.stringify(data), (err) => {
        console.log(`[${id}] Finished write for ${path}`);
        err && console.log('Problem Saving: ', err);
        resolve();
      })
    })
  }

  function _read(path, name) {
    const id = getID();
    console.log(`[${id}] Setting up read for ${path}`);
    return new Promise(resolve => {
      console.log(`[${id}] Starting read for ${path}`);
      fs.readFile(path, (err, data) => {
        console.log(`[${id}] Finished read for ${path}`);
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