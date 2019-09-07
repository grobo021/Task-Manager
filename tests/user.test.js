const request = require('supertest')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const app = require('../src/app')
const User = require('../src/models/user')

const _id1 = new mongoose.Types.ObjectId()
const user1 = {
    _id: _id1,
    name: 'ChocoWaffles',
    email: 'waffles@choco.io',
    password: 'ChocoWaffles100@',
    tokens: [{
        token: jwt.sign({ _id: _id1 }, process.env.JWT_SECRET)
    }]
}

beforeEach(async () => {
    await User.deleteMany()
    await new User(user1).save()
})

test('Should sign up a new user', async () => {
    const response = await request(app).post('/users').send({
        name: 'Rishab',
        email: 'rishabarora2008@googlemail.com',
        password: 'MyCode765$'
    }).expect(201)

    // Asserts that something is changed correctly in the DB
    const user = await User.findById(response.body.user._id)
    expect(user).not.toBeNull()

    // Assertions about response
    expect(response.body).toMatchObject({
        user: {
            name: 'Rishab',
            email: 'rishabarora2008@googlemail.com'
        },
        token: user.tokens[0].token
    })
    expect(user.password).not.toBe('MyCode765$')
})

test('Should login a existing user', async () => {
    const response = await request(app).post('/users/login').send({
        email: user1.email,
        password: user1.password
    }).expect(200)

    const user = await User.findById(_id1)
    expect(response.body.token).toBe(user.tokens[1].token)
})

test('Should not login a non-existing user', async () => {
    await request(app).post('/users/login').send({
        email: user1.email,
        password: 'notmypasscodelolol'
    }).expect(400)
})

test('Should get profile for user', async () => {
    await request(app)
        .get('/users/me')
        .set('Authorization', `Bearer ${user1.tokens[0].token}`)
        .send()
        .expect(200)
})

test('Should not get profile for unauthorized user', async () => {
    await request(app)
        .get('/users/me')
        .send()
        .expect(401)
})

test('Should delete account for user', async () => {
    await request(app)
        .delete('/users/me')
        .set('Authorization', `Bearer ${user1.tokens[0].token}`)
        .send()
        .expect(200)

    const user = await User.findById(_id1)
    expect(user).toBeNull()
})

test('Should not delete account for unauthenticate user', async () => {
    await request(app)
        .delete('/users/me')
        .send()
        .expect(401)
})