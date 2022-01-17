'use strict';

const Hapi = require('@hapi/hapi')
const Jwt = require('@hapi/jwt')
const jwt = require('jsonwebtoken')
const axios = require('axios')
const db = require('./config/db')
const { parseString } = require('xml2js');
const limit = 10;

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

exports.init = async () => {
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
            path: '/token',
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
            config: {
                handler: async (request, h) => {
                    const page = request.query.page || 1
                    const offset = page == 1 ? 0 : (page * limit) - limit
                    try {
                        const products = await db.query('SELECT * FROM products ORDER BY id LIMIT $1 OFFSET $2', [limit, offset])
                        return h.response({
                            error: false,
                            page,
                            data: products.rows
                        })
                    } catch (error) {
                        console.log(error)
                        return h.response({
                            error: true,
                        })
                    }

                },
                auth: {
                    strategy: 'strategy',
                }
            }
        },
        {
            // Add product
            method: 'POST',
            path: '/product',
            config: {
                handler: async (request, h) => {
                    try {
                        const { sku, name, image, price, description } = request.payload
                        await db.query('INSERT INTO products (sku,name,image,price,description) VALUES ($1,$2,$3,$4,$5)', [sku, name, image, price, description])

                        return h.response({ error: false })
                    } catch (error) {
                        return h.response({ error: true })
                    }
                },
                auth: {
                    strategy: 'strategy',
                }
            }
        },
        {
            // Detail Product
            method: 'GET',
            path: '/product/{id}',
            config: {
                handler: async (request, h) => {
                    const { id } = request.params
                    const product = await db.query("SELECT * FROM products WHERE id=$1", [id])
                    const res = h.response({
                        error: false,
                        data: product.rows[0]
                    })
                    return res
                },
                auth: {
                    strategy: 'strategy',
                }
            }
        },
        {
            // Update product
            method: 'PUT',
            path: '/product/{id}',
            config: {
                handler: async (request, h) => {
                    try {
                        const { id } = request.params
                        const { name, sku, image, price } = request.payload
                        await db.query('UPDATE product SET name=$1,sku=$2,image=$3,price=$4 WHERE id=$5', [name, sku, image, price, id])
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
                },
                auth: {
                    strategy: 'strategy',
                }
            }
        },
        {
            // Delete product
            method: 'DELETE',
            path: '/product/{id}',
            config: {
                handler: async (request, h) => {
                    const { id } = request.params
                    try {
                        await db.query("DELETE FROM products where id=$1", [id])
                        return h.response({ error: false, msg: 'data has been deleted!' })
                    } catch (error) {
                        return h.response({ error: true, mgs: 'delete failed' })
                    }
                },
                auth: {
                    strategy: 'strategy',
                }
            }
        }
    ])

    server.route([
        {
            // List
            method: 'GET',
            path: '/transaction',
            config: {
                handler: async (request, h) => {
                    try {
                        const page = request.query.page || 1
                        const offset = page == 1 ? 0 : (page * limit) - limit
                        const data = await db.query("SELECT * FROM transactions ORDER BY id LIMIT $1 OFFSET $2", [limit, offset])
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
                },
                auth: {
                    strategy: 'strategy',
                }
            }
        },
        {
            // Detail
            method: 'GET',
            path: '/transaction/{id}',
            config: {
                handler: async (request, h) => {
                    try {
                        const { id } = request.params
                        const data = await db.query("SELECT * FROM transactions WHERE id=$1", [id])
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
                },
                auth: {
                    strategy: 'strategy',
                }
            }
        },
        {
            // Create
            method: "POST",
            path: "/transaction",
            config: {
                handler: async (request, h) => {
                    try {
                        const { productId, qty } = request.payload
                        let res = await db.query('SELECT sku,stock,price FROM products WHERE id=$1', [productId])

                        if (!res.rows[0]) {
                            return h.response({
                                error: true,
                                msg: 'Product not found'
                            })
                        }

                        let { sku, stock, price } = res.rows[0]
                        if (stock <= 0) {
                            return h.response({ error: true, msg: 'stock kurang' })
                        }
                        try {
                            await db.query('BEGIN')
                            await db.query('UPDATE products SET stock=stock-$1', [qty])
                            await db.query('INSERT INTO transactions (productid,sku,qty,amount) VALUES($1,$2,$3,$4)', [productId, sku, qty, qty * price])

                            await db.query('COMMIT')
                        } catch (error) {
                            await db.query('ROLLBACK')
                            console.log(error)
                            return h.response({ error: true, msg: 'Failed' })
                        }
                        return h.response({ error: false, msg: 'Success' })
                    } catch (error) {
                        console.log(error)
                        return h.response({ error: true, msg: 'error' })
                    }
                },
                auth: {
                    strategy: 'strategy',
                }
            }
        },
        {
            // Update
            method: 'PUT',
            path: '/transaction/{id}',
            config: {
                handler: async (request, h) => {
                    try {
                        const id = request.params.id
                        const { sku, qty } = request.payload
                        const tx = await db.query('SELECT a.*,b.price,b.stock FROM transactions a JOIN products b ON b.sku=a.sku WHERE a.id=$1', [id])
                        const data = tx.rows[0]

                        if (!data) {
                            return h.response({
                                error: true,
                                msg: 'Data not found!'
                            })
                        }
                        let amount = qty * data.price
                        let stock = data.stock - (qty - data.qty)

                        try {
                            await db.query('BEGIN')
                            await db.query('UPDATE transactions SET qty=$1,amount=$2 WHERE id=$3', [qty, amount, id])
                            await db.query('UPDATE products SET stock=$1 WHERE sku=$2', [stock, data.sku])
                            await db.query('COMMIT')
                        } catch (error) {
                            await db.query('ROLLBACK')
                            return h.response({
                                error: true,
                                msg: 'Transaction Failed'
                            })
                        }
                        return h.response({
                            error: false,
                            msg: 'Transaction succeed!'
                        })
                    } catch (error) {
                        console.log(error)
                        return h.response({
                            error: true
                        })
                    }

                },
                auth: {
                    strategy: 'strategy',
                }
            }
        },
        {
            // Delete
            method: 'DELETE',
            path: '/transaction/{id}',
            config: {

                handler: async (request, h) => {
                    const { id } = request.params
                    const tx = await db.query("SELECT * FROM transactions WHERE id=$1", [id])
                    const data = tx.rows[0]
                    if (!data) {
                        return h.response({
                            error: true,
                            msg: 'Transaction not found'
                        })
                    }

                    try {
                        await db.query("BEGIN")
                        await db.query("UPDATE products SET stock=stock+$1", [data.qty])
                        await db.query("DELETE FROM transactions WHERE id=$1", [id])
                        await db.query("COMMIT")
                    } catch (error) {
                        await db.query("ROLLBACK")
                        return h.response({
                            error: true,
                            msg: 'Delete Failed'
                        })
                    }

                    return h.response({
                        error: true,
                        msg: 'Transaction has been deleted!'
                    })

                },
                auth: {
                    strategy: 'strategy',
                }
            }
        }
    ])
    await server.start()
    console.log('Server runing on %s', server.info.uri)

    return server
}

process.on('unhandledRejection', (err) => {
    console.log(err)
    process.exit(1)
})
