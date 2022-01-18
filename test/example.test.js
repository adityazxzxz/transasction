'use strict';

const Lab = require('@hapi/lab');
const { expect } = require('@hapi/code');
const { afterEach, beforeEach, describe, it } = exports.lab = Lab.script();
const { init } = require('../server');

let token = "";

describe('GET /token', () => {
    let server;

    beforeEach(async () => {
        server = await init();
    });

    afterEach(async () => {
        await server.stop();
    });

    it('Success get token', async () => {
        const res = await server.inject({
            method: 'get',
            url: '/token'
        });
        token = res.result.access_token
        expect(res.statusCode).to.equal(200);
    });

    it('fetch elevenia must be 200', async () => {
        const res = await server.inject({
            method: 'get',
            url: '/elevenia'
        });
        expect(res.statusCode).to.equal(200);
    });

    it('get 401 auth', async () => {
        const res = await server.inject({
            method: 'get',
            url: '/product'
        });
        expect(res.statusCode).to.equal(401);
    });

    it('product with auth token', async () => {
        const res = await server.inject({
            method: 'get',
            url: '/product',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        expect(res.statusCode).to.equal(200);
    });

    it('Approve transaction if stock ready', async () => {
        const res = await server.inject({
            method: 'post',
            url: '/transaction',
            headers: { 'Authorization': 'Bearer ' + token },
            payload: {
                productId: 1,
                qty: 1
            }
        });
        expect(res.result.error).to.equal(false);
    });

    it('reject transaction if stock <= 0', async () => {
        const res = await server.inject({
            method: 'post',
            url: '/transaction',
            headers: { 'Authorization': 'Bearer ' + token },
            payload: {
                productId: 1,
                qty: 10000000
            }
        });
        expect(res.result.error).to.equal(true);
    });



});