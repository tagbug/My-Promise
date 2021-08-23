class promise {
    #promiseState = promise.PENDING; // pending/fulfilled/rejected    resolved -> fulfilled/rejected
    #promiseValue = null; // fulfilled后的值
    #promiseReason = null; // rejected的原因
    #onFulfilledCb = []; // fulfilled回调方法数组
    #onRejectedCb = []; // rejected回调方法数组

    // 用静态常量定义promise的三种状态
    static PENDING = 'pending';
    static FULFILLED = 'fulfilled';
    static REJECTED = 'rejected';

    #resolve(value) {
        setTimeout(() => { // 异步resolve，保证构造函数能先执行完毕
            if (this.#promiseState === promise.PENDING) {
                this.#promiseState = promise.FULFILLED;
                this.#promiseValue = value;
                // 回调缓存的onFulfilled方法
                this.#onFulfilledCb.forEach((fn) => fn(value));
            }
        });
    }
    #reject(reason) {
        setTimeout(() => { // 异步reject，保证构造函数能先执行完毕
            if (this.#promiseState === promise.PENDING) {
                this.#promiseState = promise.REJECTED;
                this.#promiseReason = reason;
                // 回调缓存的onRejected方法
                if (this.#onRejectedCb.length === 0) {
                    // 没有onRejected方法处理异常，则直接抛出
                    throw new Error('Uncaught (in promise) ' + reason);
                } else {
                    this.#onRejectedCb.forEach((fn) => fn(reason));
                }
            }
        });
    }
    static #resolvePromise(promise2, x, resolve, reject) {// promise: 原先的Promise  x: 要递归的值(Promise/others)
        // 如果x和promise相等，则是循环调用，抛出异常
        if (promise2 === x) {
            reject(new TypeError('Chaining cycle detected for promise'));
            return;
        }
        // 如果x是Promise，则解决这个Promise
        if (x instanceof promise) {
            x.then(value => {
                promise.#resolvePromise(promise2, value, resolve, reject);
            },
                reason => {
                    reject(reason);
                });
        } else { // 其他的值，直接解决
            resolve(x);
        }

    }

    constructor(executor) {
        // 如果executor不是方法，抛出异常
        if (typeof executor !== 'function') {
            throw new TypeError(`Promise resolver ${executor} is not a function`);
        }
        try {
            executor(this.#resolve.bind(this), this.#reject.bind(this));
        } catch (e) {
            // 执行executor时抛出异常则直接reject
            this.#reject(e);
        }
    }

    #then(onFulfilled, onRejected, onFinally) { // 考虑带有Finally回调
        // 如果传入值不是方法，则使用默认方法（将value或reason传递给下一个Promise）
        if (typeof onFulfilled !== 'function') {
            onFulfilled = (value) => value;
        }
        if (typeof onRejected !== 'function') {
            onRejected = (reason) => { throw reason };
        }
        /**先考虑不使用新Promise实例的情况*****
            // 当已resolved时，直接回调对应方法
            if (this.#promiseState === promise.FULFILLED) {
                setTimeout(() => onFulfilled(this.#promiseValue));
            }
            if (this.#promiseState === promise.REJECTED) {
                setTimeout(() => onRejected(this.#promiseReason));
            }
            // 如果还在pending状态，则添加回调到数组中等待
            if (this.#promiseState === promise.PENDING) {
                this.#onFulfilledCb.push((value) => { setTimeout(() => onFulfilled(value)) });
                this.#onRejectedCb.push((reason) => { setTimeout(() => onRejected(reason)) });
            }
        */
        // 用新的Promise实例将回调包装
        let promise2 = new promise((resolve, reject) => {
            // 当已resolved时，直接回调对应方法
            if (this.#promiseState === promise.FULFILLED) {
                setTimeout(() => {
                    try {
                        if (typeof onFinally === 'function') onFinally();
                        let x = onFulfilled(this.#promiseValue);
                        promise.#resolvePromise(promise2, x, resolve, reject);
                    } catch (e) {
                        reject(e);
                    }
                });
            }
            if (this.#promiseState === promise.REJECTED) {
                setTimeout(() => {
                    try {
                        if (typeof onFinally === 'function') onFinally();
                        let x = onRejected(this.#promiseReason);
                        promise.#resolvePromise(promise2, x, resolve, reject);
                    } catch (e) {
                        reject(e);
                    }
                });
            }
            // 如果还在pending状态，则添加回调到数组中等待
            if (this.#promiseState === promise.PENDING) {
                this.#onFulfilledCb.push((value) => setTimeout(() => {
                    try {
                        if (typeof onFinally === 'function') onFinally();
                        let x = onFulfilled(value);
                        promise.#resolvePromise(promise2, x, resolve, reject);
                    } catch (e) {
                        reject(e);
                    }
                }));
                this.#onRejectedCb.push((reason) => setTimeout(() => {
                    try {
                        if (typeof onFinally === 'function') onFinally();
                        let x = onRejected(reason);
                        promise.#resolvePromise(promise2, x, resolve, reject);
                    } catch (e) {
                        reject(e);
                    }
                }));
            }
        });
        return promise2;
    }

    then(onFulfilled, onRejected) {
        return this.#then(onFulfilled, onRejected, undefined);
    }

    catch(onRejected) {
        return this.#then(undefined, onRejected, undefined);
    }

    finally(onFinally) {
        if (typeof onFinally !== 'function') {
            onFinally = () => { };
        }
        return this.#then(undefined, undefined, onFinally);
    }

    // 静态promise生成器
    static resolve(value) {
        return new promise((resolve, reject) => resolve(value));
    }

    static reject(reason) {
        return new promise((resolve, reject) => reject(reason));
    }

    static all(promises) {
        let promise2 = new promise((resolve, reject) => {
            // 只有可迭代的对象才能用for-of
            if (promises[Symbol.iterator]) {
                // TODO: 这里不太清楚是不是必须按照原来数组的顺序放回结果，所有的iterable对象都有length属性吗？
                /* let result = new Array(promises.length);
                const resolveOne = (value, index) => {
                    result[index] = value;
                }
                let index = 0; */
                let result = [];
                const resolveOne = (value) => {
                    result.push(value);
                    if (result.length === promises.length) {
                        // 当所有Promise都解决后返回
                        resolve(result);
                    }
                }
                for (let elem of promises) {
                    setTimeout(() => {
                        this.#resolvePromise(promise2, elem, resolveOne, reject);// 一旦有一个拒绝->直接拒绝
                    })
                }
            }
        })
        return promise2;
    }

    static allSettled(promises) {
        let promise2 = new promise((resolve, reject) => {
            // 只有可迭代的对象才能用for-of
            if (promises[Symbol.iterator]) {
                let result = [];
                const resolveOne = (value) => {
                    result.push({ status: "fulfilled", value });
                    if (result.length === promises.length) {
                        // 当所有Promise都解决后返回
                        resolve(result);
                    }
                }
                const rejectOne = (reason) => {
                    result.push({ status: "rejected", reason });
                    if (result.length === promises.length) {
                        // 当所有Promise都解决后返回
                        resolve(result);
                    }
                }
                for (let elem of promises) {
                    setTimeout(() => {
                        this.#resolvePromise(promise2, elem, resolveOne, rejectOne);// 永远都不拒绝
                    })
                }
            }
        })
        return promise2;
    }

    static race(promises) {
        let promise2 = new promise((resolve, reject) => {
            // 只有可迭代的对象才能用for-of
            if (promises[Symbol.iterator]) {
                for (let elem of promises) {
                    setTimeout(() => {
                        this.#resolvePromise(promise2, elem, resolve, reject);// 一旦有一个解决/拒绝
                    })
                }
            }
        })
        return promise2;
    }

    static any(promises) { // ES2021新增
        let promise2 = new promise((resolve, reject) => {
            // 只有可迭代的对象才能用for-of
            if (promises[Symbol.iterator]) {
                let count = 0;
                const rejectOne = (reason) => {
                    count += 1;
                    if (count === promises.length) {
                        // 当所有Promise都拒绝后返回
                        reject(result);
                    }
                }
                for (let elem of promises) {
                    setTimeout(() => {
                        this.#resolvePromise(promise2, elem, resolve, rejectOne);// 只有所有都拒绝才拒绝
                    })
                }
            }
        })
        return promise2;
    }

    // 重写Object.toString(),返回当前promise的状态+值/原因
    toString() {
        let stateStr = `status: ${this.#promiseState}`;
        if (this.#promiseState === promise.FULFILLED) {
            return `{ ${stateStr}, value: ${this.#promiseValue} }`;
        }
        if (this.#promiseState === promise.REJECTED) {
            return `{ ${stateStr}, reason: ${this.#promiseReason} }`;
        }
        return `{ ${stateStr} }`;
    }
}

export { promise };