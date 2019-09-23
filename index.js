(function (globalObject) {
  globalObject.Promise = globalObject.Promise || IPromise;

  function IPromise(fn) {
    var state = 'pending';
    var value = null;
    var handlers = [];

    doResolve(fn, resolve, reject);

    function doResolve(fn, onFulfilled, onRejected) {
      try {
        fn(function (value) {
          onFulfilled(value)
        }, 
          function (reason) {
            onRejected(reason)
          })
        } catch (ex) {
        onRejected(ex)
      }
    }

    function resolve(result) {
      try {
        var t = typeof result;
        if (result && (t === 'object' || t === 'function')) {
          if (typeof result.then === 'function') {
            var then = result.then;
          }
        }
        if (then) {
          doResolve(then.bind(result), resolve, reject)
          return
        }
        fulfill(result);
      } catch (e) {
        reject(e);
      }
    }

    function fulfill(result) {
      state = 'fulfilled';
      value = result;
      handlers.forEach(handle);
      handlers = null;
    }

    function reject(error) {
      state = 'rejected';
      value = error;
      handlers.forEach(handle);
      handlers = null;
    }

    this.then = function (onFulfilled, onRejected) {
      return new IPromise(function (resolve, reject) {
        return handle({
          onFulfilled: function (result) {
            if (typeof onFulfilled === 'function') {
              try {
                return resolve(onFulfilled(result));
              } catch (ex) {
                return reject(ex);
              }
            } else {
              return resolve(result);
            }
          },
          onRejected: function (error) {
            if (typeof onRejected === 'function') {
              try {
                return resolve(onRejected(error));
              } catch (ex) {
                return reject(ex);
              }
            } else {
              return reject(error);
            }
          }
        });
      });
    }
     
    function handle(handler) {
      if (state === 'pending') {
        handlers.push(handler);
      } else {
        if (state === 'fulfilled' &&
          typeof handler.onFulfilled === 'function') {
          handler.onFulfilled(value);
        }
        if (state === 'rejected' &&
          typeof handler.onRejected === 'function') {
          handler.onRejected(value);
        }
      }
    }  
  }
}(this))