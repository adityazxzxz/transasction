'use strict';

const Lab = require('@hapi/lab');
const { expect } = require('@hapi/code');
const { afterEach, beforeEach, describe, it } = exports.lab = Lab.script();
const { init } = require('../index');

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
        expect(res.statusCode).to.equal(200);
    });

    it('fetch elevenia must be 200', async () => {
        const res = await server.inject({
            method: 'get',
            url: '/elevenia'
        });
        expect(res.statusCode).to.equal(200);
    });
});