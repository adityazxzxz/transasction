const Hapi = require('@hapi/hapi');

(async () => {
    const server = await new Hapi.Server({
        port: 8000
    })

    await server.register([
        require('inert'),
        require('vision'),
        {
            plugin: require('hapi-swaggered'),
            options: {
                tags: {
                    'foobar/test': 'Example foobar description'
                },
                info: {
                    title: 'Example API',
                    description: 'Powered by node, hapi, joi, hapi-swaggered, hapi-swaggered-ui and swagger-ui',
                    version: '1.0'
                }
            }
        },
        {
            plugin: require('hapi-swaggered-ui'),
            options: {
                title: 'Example API',
                path: '/docs',
                authorization: {
                    field: 'apiKey',
                    scope: 'query', // header works as well
                    // valuePrefix: 'bearer '// prefix incase
                    defaultValue: 'demoKey',
                    placeholder: 'Enter your apiKey here'
                },
                swaggerOptions: {
                    validatorUrl: null
                }
            }
        }
    ])

    server.route({
        path: '/',
        method: 'GET',
        handler(request, h) {
            return h.response().redirect('/docs')
        }
    })

    try {
        await server.start()
        console.log('Server running at:', server.info.uri)
    } catch (err) {
        console.log(err)
    }
})()