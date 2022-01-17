'use strict';

const Hapi = require('@hapi/hapi')
const Jwt = require('@hapi/jwt')
const jwt = require('jsonwebtoken')
const axios = require('axios')
const db = require('./config/db')
const { parseString } = require('xml2js');

const parser = (xml) => {
    return new Promise((resolve, reject) => {
        parseString(xml, { explicitArray: false }, (err, result) => {
            if (err) {
                reject(err)
            } else {
                resolve(result)
            }
        })
    })
}

const init = async () => {
    const server = Hapi.server({
        port: 3000,
        host: 'localhost'
    })

    await server.register(Jwt)

    server.auth.strategy('strategy', 'jwt', {
        keys: 'secret',
        verify: {
            aud: 'urn:audience:test',
            iss: 'urn:issuer:test',
            sub: false,
            nbf: true,
            exp: true,
            maxAgeSec: 14400,
            timeSkewSec: 15
        },
        validate: (artifacts, request, h) => {
            return {
                isValid: true,
                credentials: {
                    user: artifacts.decoded.payload.user
                }
            }
        }
    })

    server.route([
        {
            // List elevenia
            method: 'GET',
            path: '/elevenia',
            config: {
                handler: async (request, h) => {
                    try {
                        const resp = await axios({
                            method: 'get',
                            url: 'http://api.elevenia.co.id/rest/prodservices/product/listing',
                            headers: {
                                'Content-Type': 'application/xml',
                                'Accept-Charset': 'utf-8',
                                'openapikey': '721407f393e84a28593374cc2b347a98'
                            }
                        })

                        const obj = await parser(resp.data)
                        obj.Products.product.forEach(row => {
                            try {
                                db.query("INSERT INTO products (sku,name,price,stock) VALUES($1,$2,$3,$4) ON CONFLICT(sku) DO NOTHING", [row.sellerPrdCd, row.prdNm, row.selPrc, row.prdSelQty])
                            } catch (error) {
                                console.log(error)
                            }
                            // console.log({
                            //     name: row.prdNm,
                            //     stock: row.prdSelQty,
                            //     price: row.selPrc,
                            // })
                        });
                        let data = obj.Products.product.map(row => {
                            return {
                                name: row.prdNm,
                                stock: row.prdSelQty,
                                price: row.selPrc,
                                sku: row.sellerPrdCd
                            }
                        })
                        return h.response(data)
                    } catch (error) {
                        return h.response(error)
                    }


                }
            },

        },
        {
            // get access token
            method: 'GET',
            path: '/',
            config: {
                handler(request, h) {
                    const token = jwt.sign({
                        aud: 'urn:audience:test',
                        iss: 'urn:issuer:test',
                        sub: false,
                        maxAgeSec: 14400,
                        timeSkewSec: 15
                    }, 'secret');
                    return {
                        access_token: token
                    }
                }
            },

        },
        {
            method: 'GET',
            path: '/secret',
            config: {
                handler(request, h) {
                    return 'secret';
                },
                auth: {
                    strategy: 'strategy',
                }
            }
        },
        {
            // List all product
            method: 'GET',
            path: '/product',
            handler: async (request, h) => {
                try {
                    const products = await db.query('SELECT * FROM products')
                    return h.response({
                        error: false,
                        data: products.rows
                    })
                } catch (error) {
                    console.log(error)
                    return h.response({
                        error: true,
                    })
                }

            }
        },
        {
            // Add product
            method: 'POST',
            path: '/product',
            handler: async (request, h) => {
                try {
                    const { sku, name, image, price, description } = request.payload
                    await db.query('INSERT INTO products (sku,name,image,price,description) VALUES ($1,$2,$3,$4,$5)', [sku, name, image, price, description])

                    return h.response({ error: false })
                } catch (error) {
                    return h.response({ error: true })
                }
            }
        },
        {
            // Detail Product
            method: 'GET',
            path: '/product/{code}',
            handler: async (request, h) => {
                const { code } = request.params
                const product = await db.query("SELECT * FROM products WHERE sku=$1", [code])
                const res = h.response({
                    error: false,
                    data: product.rows[0]
                })
                return res
            }
        },
        {
            // Update product
            method: 'PUT',
            path: '/product/{code}',
            handler: async (request, h) => {
                try {
                    const { code } = request.params
                    const { name, sku, image, price } = request.payload
                    await db.query('UPDATE product SET name=$1,sku=$2,image=$3,price=$4 WHERE sku=$5', [name, sku, image, price, code])
                    return h.response({
                        error: false,
                        msg: 'update success!'
                    })
                } catch (error) {
                    return h.response({
                        error: true,
                        msg: 'update Failed'
                    })
                }
            }
        },
        {
            // Delete product
            method: 'DELETE',
            path: '/product/{code}',
            handler: async (request, h) => {
                const { code } = request.params
                try {
                    await db.query("DELETE FROM products where sku=$1", [code])
                    return h.response({ error: false, msg: 'data has been deleted!' })
                } catch (error) {
                    return h.response({ error: true, mgs: 'delete failed' })
                }
            }
        }
    ])

    server.route([
        {
            method: 'GET',
            path: '/transaction',
            handler: async (request, h) => {
                try {
                    const data = await db.query("SELECT * FROM transactions")
                    return h.response({
                        error: false,
                        data: data.rows
                    })
                } catch (error) {
                    return h.response({
                        error: true,
                        msg: 'failed'
                    })
                }
            }
        }
    ])



    await server.start()
    console.log('Server runing on %s', server.info.uri)
}

process.on('unhandledRejection', (err) => {
    console.log(err)
    process.exit(1)
})

init()