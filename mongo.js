const mongoose = require('mongoose');

if (process.argv.length < 3) {
    console.error('Please provide the password: node mongo.js <password>');
    process.exit(1);
}
const password = process.argv[2];
const url = `mongodb+srv://cezarmongo:${password}@phonebook.mkzwpfw.mongodb.net/phonebookApp?retryWrites=true&w=majority`;

let showAll = false;

if (process.argv.length < 4) {
    showAll = true;
}

if (process.argv.length === 4) {
    console.error('Please provide the phone number for the provided name: node mongo.js <password> <name> <phone_number>');
    process.exit(1);
}

const personSchema = new mongoose.Schema({
    name: String,
    number: String
});

const Person = mongoose.model('Person', personSchema);

if (!showAll) {
    const name = process.argv[3];
    const number = process.argv[4];

    mongoose
        .connect(url)
        .then(() => {
            const person = new Person({
                name: name,
                number: number
            });
            return person.save();
        })
        .then(() => {
            console.log(`added ${name} number ${number} to phonebook`);
            return mongoose.connection.close();
        })
        .catch(err => console.error(err));
} else {
    mongoose
        .connect(url)
        .then(() => {
            return Person
                .find();
        })
        .then((resFind) => {
            console.log('Phonebook:');
            if (resFind.length === 0) {
                console.log('is empty');
            } else {
                resFind.forEach(entity => {
                    console.log(`${entity.name} ${entity.number}`);
                });
            }
            mongoose.connection.close();
        })
        .catch(err => console.error(err));

}


