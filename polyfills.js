// Полифиллы для Android 7 (Chrome 51 WebView)

// 1. Promise полифилл
if (!window.Promise) {
    (function () {
        'use strict';
        window.Promise = function (executor) {
            var self = this;
            self.state = 'pending';
            self.value = undefined;
            self.handlers = [];

            function resolve(result) {
                if (self.state === 'pending') {
                    self.state = 'fulfilled';
                    self.value = result;
                    self.handlers.forEach(function (handler) {
                        handler.onFulfilled && handler.onFulfilled(self.value);
                    });
                }
            }

            function reject(error) {
                if (self.state === 'pending') {
                    self.state = 'rejected';
                    self.value = error;
                    self.handlers.forEach(function (handler) {
                        handler.onRejected && handler.onRejected(self.value);
                    });
                }
            }

            try {
                executor(resolve, reject);
            } catch (e) {
                reject(e);
            }
        };

        window.Promise.prototype.then = function (onFulfilled, onRejected) {
            var self = this;
            return new Promise(function (resolve, reject) {
                if (self.state === 'fulfilled') {
                    setTimeout(function () {
                        try {
                            var result = onFulfilled ? onFulfilled(self.value) : self.value;
                            resolve(result);
                        } catch (e) {
                            reject(e);
                        }
                    }, 0);
                } else if (self.state === 'rejected') {
                    setTimeout(function () {
                        try {
                            reject(onRejected ? onRejected(self.value) : self.value);
                        } catch (e) {
                            reject(e);
                        }
                    }, 0);
                } else {
                    self.handlers.push({
                        onFulfilled: function (value) {
                            try {
                                var result = onFulfilled ? onFulfilled(value) : value;
                                resolve(result);
                            } catch (e) {
                                reject(e);
                            }
                        },
                        onRejected: function (error) {
                            try {
                                reject(onRejected ? onRejected(error) : error);
                            } catch (e) {
                                reject(e);
                            }
                        }
                    });
                }
            });
        };

        window.Promise.resolve = function (value) {
            return new Promise(function (resolve) { resolve(value); });
        };

        window.Promise.reject = function (error) {
            return new Promise(function (resolve, reject) { reject(error); });
        };
    })();
}

// 2. localStorage полифилл
(function () {
    if (typeof (Storage) === "undefined") {
        var storage = {};
        window.localStorage = {
            setItem: function (key, value) {
                storage[key] = value;
            },
            getItem: function (key) {
                return storage[key] || null;
            },
            removeItem: function (key) {
                delete storage[key];
            },
            clear: function () {
                storage = {};
            }
        };
    } else {
        try {
            localStorage.setItem('_test', '1');
            localStorage.removeItem('_test');
        } catch (e) {
            var storage = {};
            window.localStorage = {
                setItem: function (key, value) {
                    storage[key] = value;
                },
                getItem: function (key) {
                    return storage[key] || null;
                },
                removeItem: function (key) {
                    delete storage[key];
                },
                clear: function () {
                    storage = {};
                }
            };
        }
    }
})();

// 3. fetch полифилл
if (!window.fetch) {
    window.fetch = function (url, options) {
        return new Promise(function (resolve, reject) {
            var xhr = new XMLHttpRequest();

            var method = (options && options.method) ? options.method : 'GET';
            xhr.open(method, url);

            if (options && options.headers) {
                for (var key in options.headers) {
                    if (options.headers.hasOwnProperty(key)) {
                        xhr.setRequestHeader(key, options.headers[key]);
                    }
                }
            }

            xhr.onload = function () {
                var response = {
                    ok: xhr.status >= 200 && xhr.status < 300,
                    status: xhr.status,
                    statusText: xhr.statusText,
                    headers: {},
                    url: url,
                    text: function () {
                        return Promise.resolve(xhr.responseText);
                    },
                    json: function () {
                        try {
                            return Promise.resolve(JSON.parse(xhr.responseText));
                        } catch (e) {
                            return Promise.reject(e);
                        }
                    }
                };
                resolve(response);
            };

            xhr.onerror = function () {
                reject(new Error('Network request failed'));
            };

            if (options && options.body) {
                xhr.send(options.body);
            } else {
                xhr.send();
            }
        });
    };
}

// 4. Object.assign полифилл
if (typeof Object.assign !== 'function') {
    Object.assign = function (target) {
        if (target === null || target === undefined) {
            throw new TypeError('Cannot convert undefined or null to object');
        }
        var to = Object(target);
        for (var index = 1; index < arguments.length; index++) {
            var nextSource = arguments[index];
            if (nextSource !== null && nextSource !== undefined) {
                for (var nextKey in nextSource) {
                    if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                        to[nextKey] = nextSource[nextKey];
                    }
                }
            }
        }
        return to;
    };
}

// 5. Array.from полифилл
if (!Array.from) {
    Array.from = function (arrayLike, mapFn, thisArg) {
        var C = this;
        var items = Object(arrayLike);
        if (arrayLike == null) {
            throw new TypeError('Array.from requires an array-like object');
        }
        var mapFunction = mapFn ? function (v, i) { return mapFn.call(thisArg, v, i); } : false;
        var len = items.length;
        var A = typeof C == 'function' ? Object(new C(len)) : new Array(len);
        var k = 0;
        var kValue;
        while (k < len) {
            kValue = items[k];
            if (mapFunction) {
                A[k] = mapFunction(kValue, k);
            } else {
                A[k] = kValue;
            }
            k += 1;
        }
        A.length = len;
        return A;
    };
}

// 6. Object.entries полифилл
if (!Object.entries) {
    Object.entries = function (obj) {
        var ownProps = Object.keys(obj);
        var i = ownProps.length;
        var resArray = new Array(i);
        while (i--) {
            resArray[i] = [ownProps[i], obj[ownProps[i]]];
        }
        return resArray;
    };
}

// 7. Safe optional chaining replacement
if (!window.SafeGet) {
    window.SafeGet = function (obj, path, defaultValue) {
        var current = obj;
        var parts = path.split('.');
        for (var i = 0; i < parts.length; i++) {
            if (current === null || current === undefined) {
                return defaultValue;
            }
            current = current[parts[i]];
        }
        return current !== undefined ? current : defaultValue;
    };
}

console.log('Polyfills loaded for Android 7 compatibility');

