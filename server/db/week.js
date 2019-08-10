
const mongoose = require('mongoose');
const schema = mongoose.Schema;

const weekSchema = new schema({
    userID: String,
    startDate: Date,
    endDate: Date
});



const Week = mongoose.model('Week', weekSchema);

module.exports = Week;