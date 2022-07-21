const express = require('express');
const app = express();

require('dotenv').config();

const mongoose = require('mongoose');
mongoose.connect(`mongodb+srv://admin:${process.env.MDB_PASSWORD}@startermaincluster.r3484.mongodb.net/?retryWrites=true&w=majority`);

const bcrypt = require('bcrypt');
const sr = 10;

const User = mongoose.model('User', {
  username: String,
  password: String,
  email: String,
  hasPaymentMethod: Boolean,
  subscriber: Boolean,
});

const Template = mongoose.model('Template', {
  name: String,
  dependencies: Array,
  version: String,
  bucket: String,
  filename: String,
  ownerType: String,
  public: Boolean,
  owner: String
})

app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: '500mb' }));
app.use(express.json({ limit: '50mb' }));

app.post('/api/v1/register', (req, res) => {
  const userData = req.body;
  bcrypt.hash(req.body.password, sr, function(err, hash) {
    if (err) {
      throw err;
    } else {
      userData.password = hash;
      userData.hasPaymentMethod = false;
      userData.subscriber = false;
      const newUser = new User(userData);
      newUser.save().then((data) => res.json(data));
    }
  });
});

app.get('/api/v1/users/:id', async(req, res) => {
  if (req.params.id) {
    const userDb = await User.findOne({ _id: req.params.id });
    if (userDb) {
      res.status(200);
      res.json(userDb);
    } else {
      res.status(404);
    }
  } else {
    res.status(404);
  }
})

app.get('/api/v1/users', async(req, res) => {
  const usersDb = await User.find({});
  if (usersDb) {
    res.status(200);
    res.json(usersDb)
  } else {
    res.status(404);
  }
})

app.post('/api/v1/login', async(req, res) => {
  const userData = req.body;
  if (userData) {
    const userDb = await User.findOne({ username: userData.username });
    if (userDb !== null) {
      const authorized = await bcrypt.compare(userData.password, userDb.password);
      if (authorized) {
        res.status(200);
        res.json('Authenticated')
      } else {
        res.status(401);
        res.json('Unauthorized')
      }
    } else {
      res.status(422);
      res.json("These credentials don't seem right... Is this username valid?")
    }
  }
});

app.post('/test', async(req, res) => {
  res.send(req.body);
})

app.post('/api/v1/template', async(req, res) => {
  const query = req.body;
  const username = req.body.owner.username;
  const password = req.body.owner.password;

  query.owner = req.body.owner.username;

  const newTemplate = new Template(query);

  if (username && password) {
    const userDb = await User.findOne({ username: username });
    if (userDb !== null) {
      const authorized = await bcrypt.compare(password, userDb.password);
      if (authorized) {
        // check target for permissions
        const templateDb = await Template.findOne({ name: query.name });
        if (templateDb !== null) {
          res.status(409);
          res.send('Template already exists in database');
        } else {
          newTemplate.save().then((data) => {
            res.status(201);
            res.json(data);
          });
        }
      } else {
        res.status(401);
        res.json('Unauthorized')
      }
    } else {
      res.status(404);
      res.json("These credentials don't seem right... Is this username valid?")
    }
  }
});

app.post('/api/v1/template/get', async(req, res) => {
  const query = req.body;

  const user = JSON.parse(query.user);

  const username = user.username;
  const password = user.password;

  const target = query.requested_file;

  if (username && password) {
    const userDb = await User.findOne({ username: username });
    if (userDb !== null) {
      const authorized = await bcrypt.compare(password, userDb.password);
      if (authorized) {
        // check target for permissions
        const templateDb = await Template.findOne({ filename: target });
        if (templateDb == null) {
          res.status(404);
        } else {
          switch (templateDb.public) {
            case true:
              res.status(200);
              res.json(templateDb);
              break;

            case false:
              if (templateDb.owner === userDb.username) {
                res.status(200);
                res.json(templateDb);
              } else {
                res.status(401);
                res.send('Unauthorized');
              };
              break;
            default:
              break;
          }
        }
      } else {
        res.status(401);
        res.json('Unauthorized')
      }
    } else {
      res.status(404);
      res.json("These credentials don't seem right... Is this username valid?")
    }
  }
})

module.exports.app = app;
