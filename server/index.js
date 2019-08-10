require('dotenv').config();
var cors = require('cors')
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
const mongoose = require('./db/mongoose');
const User = require('./db/user');
const Week = require('./db/week');
const Task = require('./db/task');

const express = require('express');
const app = express();
const port = process.env.PORT;

require('./passport');
const passport = require('passport');

// Create a default admin user account if it doesn't already exist.
User.findOne({email: process.env.DEFAULT_ADMIN_EMAIL}, (err, doc) => {
    if (!doc) {
        User.create({name: 'Admin', email: process.env.DEFAULT_ADMIN_EMAIL, password: process.env.DEFAULT_ADMIN_PASSWORD, admin: true, active: true}, (err, user) => {
            if (err) {
                return;
            }
            const startDate = new Date();
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + 6);

             // If user account created successfully, create initial week for the account
             Week.create({userID: user._id, startDate: startDate, endDate: endDate}, (err, week) => {
                // If initial week cannot be created, delete user.
                if (err) {
                    User.findOneAndDelete({email: email});
                }
            });
        });
    }
});

var corsOptions = {
    origin: process.env.CORS_ORIGIN,
    credentials: true
  };
app.use(cors(corsOptions));
app.options(process.env.CORS_ORIGIN, cors());

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())
app.use(cookieParser());

// Retrieve all weeks for a specified user.
app.get('/weeks/user/:userID', passport.authenticate('jwt', { session: false }), (req, res) => {
    const userID = req.params.userID;

    Week.findOne({userID: userID}, (err, week) => {
        console.log("week");
        console.log(week);
        if (err) {
            res.sendStatus(500);
            return;
        }
        // TODO: GET ALL TASKS FOR WEEK.
        const weekID = week._id.toString();
        Task.find({weekID: weekID}, (err, tasks) => {
            console.log(tasks);
            console.log(week);
            var weekResObj = {
                week: week,
                tasks: tasks
            };
            res.status(200).send(weekResObj);
            return;
        });
    });
});

// Retrieve all tasks for a specific user.
app.get('/tasks/user/:userID', passport.authenticate('jwt', { session: false }), (req, res) => {
    const userID = req.params.userID;
    console.log(userID);
    Task.find({userID: userID}, (err, tasks) => {
        if (err) {
            res.sendStatus(500);
            return;
        }
        
        if (tasks.length <= 0) {
            res.sendStatus(404);
            return;
        }
        res.status(200).send(tasks);
    });

});

app.post('/tasks/create', passport.authenticate('jwt', { session: false }), (req, res) => {
    const {userID, weekID, taskDescription, priority, weekDay} = req.body;
    Task.create({userID: userID, description: taskDescription, weekID: weekID, completed: false, targetDay: weekDay, priority: priority}).then((doc) => {
        res.sendStatus(200);
        return;
    }).catch((err) => {
        res.sendStatus(500);
        return;
    });
});

app.put('/tasks/update/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
    const taskID = req.params.id;
    const {taskDescription, priority} = req.body;

    Task.findOneAndUpdate({_id: taskID}, {description: taskDescription, priority: priority}, (err, task) => {
        if (err) {
            res.sendStatus(500);
            return;
        }

        res.sendStatus(200);
    });
});

app.put('/tasks/completed/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
    const taskID = req.params.id;
    const {completed} = req.body;

    Task.findOneAndUpdate({_id: taskID}, {completed: completed}, (err, task) => {
        if (err) {
            res.sendStatus(500);
            return;
        }

        res.sendStatus(200);
    });
});

app.delete('/tasks/delete/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
    const taskID = req.params.id;
    Task.findByIdAndDelete(taskID, (err, data) => {
        if (err) {
            res.sendStatus(500);
            return;
        }
        res.sendStatus(200);
    });
});

app.post('/login', async (req, res) => {
    console.log("logging in");
    // 1. Get username + password from request.
    const {email, password} = req.body;
    // 2. Check for username + password match.
    try {
        const user = await User.findByCredentials(email, password);
        // 3. Make token on match.
        var token = user.generateJWT();
        // 4. Set header with token.
        res.cookie('jwt', token, {httpOnly: true});
        // 5. Return user object without password.
        var resUser = {_id: user._id, name: user.name, email: user.email, admin: user.admin};

        res.status(200).send(user);
    } catch(e) {
        res.sendStatus(404);
    }
    
});

// Attempt to log in a user.
// app.post('/login', (req, res) => {
//     // 1. Get username + password from request.
//     const {email, password} = req.body;
//     console.log(req.body); console.log(password);
//     // 2. Check for username + password match.
//     User.findOne({email: email, password: password}, (err, doc) => {
//         if (err) {
//             console.log(err);
//             return res.sendStatus(404);
//         }
//         if (!doc) {
//             return res.sendStatus(401);
//         }
//         // 3. Make token on match.
//         console.log(doc);

//         var token = doc.generateJWT();

//         // 4. Set header with token.
//         res.cookie('jwt', token, {httpOnly: true});

//         // 5. Return user object without password.
//         var user = {_id: doc._id, name: doc.name, email: doc.email, admin: doc.admin};

//         res.status(200).send(user);
//     });
// });

// Register a new user.
app.post('/register', (req, res) => {
    const {name, email, password} = req.body;

    // 1. Check to see if user already exists with the same email.
    User.findOne({email: email}, (err, doc) => {
        // If email already exists, send conflict error.
        if (doc) {
            res.status(409).send();
            return;
           
        }
        

        // 2. Attempt to add new user to the database.
        User.create({name: name, email: email, password: password, admin: false, active: true}, (err, user) => {
            if (err) {
                // console.log(err);
                res.status(500).send();
                return;
            }
    
            const startDate = new Date();
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + 6);

            // If user account created successfully, create initial week for the account
            Week.create({userID: user._id, startDate: startDate, endDate: endDate}, (err, week) => {
                // If initial week cannot be created, delete user.
                if (err) {
                    User.findOneAndDelete({email: email});
                    res.sendStatus(500);
                }
                // TODO: ADD INITIAL WEEK FOR ACCOUNT
                res.sendStatus(200);
            });
            
        });
    });

});

// Log out a user.
app.get('/logout', (req, res) => {
    res.clearCookie('jwt');
    res.send();
});


app.post('/profile', passport.authenticate('jwt', { session: false }),
    function(req, res) {
        console.log("sending user back");
        res.send(req.user);
    }
);

app.listen(port, () => console.log(`Example app listening on port ${port}!`))