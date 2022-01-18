/* eslint-disable camelcase */

exports.up = (pgm) => {
    pgm.createTable('products', {
        id: 'id',
        sku: { type: 'varchar(250)', notNull: true, unique: true },
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
        productid: {
            type: 'integer',
            notNull: true,
            references: '"products"',
            onDelete: 'cascade',
        },
        sku: { type: 'varchar(250)', notNull: true },
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
    pgm.createIndex('transactions', 'productid')
}
