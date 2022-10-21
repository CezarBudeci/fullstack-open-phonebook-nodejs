const mongoose = require('mongoose');

const connect = (url) => {
    mongoose
        .connect(url)
        .then(() => {console.log('Successfully connected to MongoDB');})
        .catch(err => console.error('Failed to connect to MongoDB: ' + err.message));
};

const close = () => {
    mongoose.connection.close();
};

module.exports = { connect, close };