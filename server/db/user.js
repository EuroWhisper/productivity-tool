
const mongoose = require('mongoose');
const schema = mongoose.Schema;
const jwt = require('jsonwebtoken');
const secret = process.env.SECRET;
const bcrypt = require('bcrypt');

const userSchema = new schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    accountActive: Boolean,
    admin: Boolean
});

// Create and return a JSON web token.
userSchema.methods.generateJWT = function() {
    return jwt.sign({_id: this._id}, secret);
};

// Find a user by its credentials.
userSchema.statics.findByCredentials = async (email, password) => {
    // 1. Attempt to find the user by email address.
    const user = await User.findOne({ email: email });
    // If user is not found, throw an error.
    if (!user) {
        throw new Error('Unable to login');
    }
    // 2. Encrypt the plaintext password and see if it matches the
    // encrypted password stored in the database.
    const isMatch = await bcrypt.compare(password, user.password);
    // If password does not match, throw an error.
    if (!isMatch) {
        throw new Error('Unable to login');
    }
    // If password does match, return the user.
    return user;
};

// Hash plaintext password before saving new or existing user.
userSchema.pre('save', async function (next) {
    const user = this;
    // If password value is being changed, hash it prior to storing it.
    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8);
    }
    next();
});

const User = mongoose.model('User', userSchema);




module.exports = User;