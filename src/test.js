import { promise } from './promise.mjs';

// Test1 passed
/* new promise((resolve, reject) => {
    setTimeout(() => { throw new Error('You write wrong') }, 100);
    // console.log('2')
    resolve(1)
})
    .then(
        value => {
            return new promise((resolve) => {
                resolve(10)
            })
        },
        // reason => {
        //     console.log('reason', reason)
        // }
    )
    .then(
        value => {
            console.log('value', value)
        },
        reason => {
            console.log('reason', reason)
        }
    ) */



// Test2 passed
/* const pp = promise.resolve(1)
    .then((v) => { console.log(v); return v; })
    .catch((e) => { console.log(e); })
    .finally(() => { console.log('finally'); })
    .catch((e) => { console.log(e); })
    .then((v) => { console.log('last' + v); });

console.log(pp); */



// Test3 some passed

// TODO: 运行不正常，Uncaught
/* promise.all([promise.resolve(1), promise.reject(2), 3])
    .then(result => { console.table(result) }).catch(reason => { console.log('catch the error', reason) });

promise.allSettled([promise.resolve(1), promise.reject(2), 3])
    .then(result => { console.table(result) }); */

// 运行正常 ??Why  异步执行顺序问题？
promise.all([promise.resolve(1), promise.reject(2).catch(reason => { throw reason }), 3])
    .then(result => { console.table(result) }).catch(reason => { console.log('catch the error', reason) });

promise.allSettled([promise.resolve(1), promise.reject(2).catch(reason => { throw reason }), 3])
    .then(result => { console.table(result) });

Promise.all([Promise.resolve(1), Promise.reject(2), 3])
    .then(result => { console.table(result) }).catch(reason => { console.log('catch the error', reason) });

Promise.allSettled([Promise.resolve(1), Promise.reject(2), 3])
.then(result => { console.table(result) });
