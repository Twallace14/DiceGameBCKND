const express = require('express');
const bodyParser = require('body-parser')
const cors = require('cors');
const knex = require('knex');
const bcrypt = require('bcrypt');

const db = knex({
    client: 'pg',
    connection: {
        host: '127.0.0.1',
        database: 'shyzu-db'

    }
});

//db.select('*').from('users').then(data => {
//    console.log(data);
//});



const app = express();

app.use(bodyParser.json());
app.use(cors())


app.get('/', (req, res) => {
    res.send("intial connect success");
})

app.post('/signin', (req, res) => {
    db.select('email', 'hash').from('login')
        .where('email', '=', req.body.email)
        .then(data => {
            const isValid = bcrypt.compareSync(req.body.password, data[0].hash);
            if (isValid) {
                return db.select("*").from('users')
                    .where('email', '=', req.body.email)
                    .then(user => {
                        res.json(user[0])
                    })
                    .catch(err => res.status(400).json('user not found'))
            } else {
                res.status(400).json('incorrect details')
            }
        })
        .catch(err => res.status(400).json('incorrect details'))
})

app.post('/register', (req, res) => {
    const { email, userName, password } = req.body;
    if(!email || !userName || !password){
        return res.status(400).json("missing information to submit form");
    }
    const hash = bcrypt.hashSync(password, 8)
    db.transaction(trx => {
        trx.insert({
            hash: hash,
            email: email
        })
        .into('login')
        .returning('email')
        .then(loginEmail => {
            return trx('users')
            .returning('*')
            .insert({
                email: loginEmail[0],
                username: userName,
                joined: new Date()
            }).then(user => {
                res.json(user[0]);
            })
        }).then(trx.commit)
        .catch(trx.rollback)
    })
        .catch(err => res.status(400).json('sorry there is a problem'))
})

app.get('/profile/:id', (req, res) => {
    const { id } = req.params;
    let found = false;
    database.users.forEach(user => {
        if (user.id === id) {
            found = true;
            return res.json(user);
        }
    })
    if (!found) {
        res.status(400).json('who are you');
    }
})

app.put('/score', (req, res) => {
    const { id } = req.body;
    db('users').where('id', '=', id)
        .increment('score', 50)
        .returning('score')
        .then(score => {
            res.json(score[0]);
        })
})



app.listen(process.env.PORT || 3000, () => {
    console.log(`app on port ${process.env.PORT}`);
})