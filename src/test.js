import { promise } from './promise.mjs';

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

const pp = promise.resolve(1)
    .then((v) => { console.log(v); return v; })
    .catch((e) => { console.log(e); })
    .finally(() => { console.log('finally'); })
    .catch((e) => { console.log(e); })
    .then((v) => { console.log('last' + v); });

console.log(pp);
