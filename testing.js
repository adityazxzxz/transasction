const Hapi = require('@hapi/hapi')
const Joi = require('joi')
const Boom = require('boom')

const server = Hapi.Server({ host: 'localhost', port: 8000 })

server.register(
    [
        {
            register: require('inert')
        },
        {
            register: require('vision')
        },
        {
            register: require('hapi-swagger-next'),
            options: {
                info: { // metadata rendered in the Swagger UI
                    title: 'Math API',
                    description: 'The Math API lets you perform basic arithmetic operations over HTTP',
                    version: '1.0.0'
                }
            }
        }
    ]
)

// Our Math Functions
const operations = {
    'add': (a, b) => {
        return a + b
    },
    'subtract': (a, b) => {
        return a - b
    },
    'multiply': (a, b) => {
        return a * b
    },
    'divide': (a, b) => {
        if (b === 0) return Boom.badRequest('cannot divide by 0')
        return a / b
    }
}

// The /math endpoint's response schema
// This is rendered as an example response in the Swagger UI
const mathResponse = Joi.object({
    values: {
        a: Joi.number(),
        b: Joi.number()
    },
    operation: Joi.string().valid(Object.keys(operations)).required(),
    result: Joi.number()
})

server.route({
    method: 'GET',
    path: '/math',
    handler: (request, reply) => {
        let { a, b, op } = request.query
        let operation = operations[op]
        return reply({
            values: {
                'a': a,
                'b': b
            },
            operation: op,
            result: operation(a, b)
        })
    },
    config: {
        validate: {
            query: {
                a: Joi.number().required(),
                b: Joi.number().required(),
                op: Joi.string().valid(Object.keys(operations)).required()
            }
        },
        tags: ['api'],
        description: 'Takes in two numbers (a,b) and performs the desired operation on them',
        response: { schema: mathResponse }
    }
})

server.start((err) => {
    if (err) throw err
    console.log('Server running at:', server.info.uri)
})