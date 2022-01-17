/* eslint-disable camelcase */

exports.up = (pgm) => {
    pgm.createTable('products', {
        sku: { type: 'varchar(250)', notNull: true, primaryKey: true },
        name: { type: 'varchar(250)', notNull: true },
        image: {
            type: 'varchar(250)',
            notNull: false,
        },
        price: {
            type: 'integer',
            notNull: true,
        },
        stock: {
            type: 'integer',
            default: "0"
        },
        description: {
            type: 'text'
        },
        createdAt: {
            type: 'timestamp',
            notNull: true,
            default: pgm.func('current_timestamp'),
        },
    })
    pgm.createTable('transactions', {
        id: 'id',
        sku: {
            type: 'varchar(250)',
            notNull: true,
            references: '"products"',
            onDelete: 'cascade',
        },
        qty: { type: 'integer', notNull: true },
        amount: {
            type: 'integer',
            notNull: true
        },
        createdAt: {
            type: 'timestamp',
            notNull: true,
            default: pgm.func('current_timestamp'),
        },
    })
    pgm.createIndex('transactions', 'sku')
}
