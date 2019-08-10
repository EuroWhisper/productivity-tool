
const mongoose = require('mongoose');
const schema = mongoose.Schema;

const taskSchema = new schema({
    userID: String,
    weekID: String,
    completed: Boolean,
    targetDay: String,
    description: String,
    priority: String,
    dateAssigned: {
        type: Date,
        default: new Date()
    },
    dateCompleted: Date
});



const Task = mongoose.model('Task', taskSchema);

module.exports = Task;