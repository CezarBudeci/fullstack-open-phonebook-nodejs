require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const app = express();
const db = require('./db/mongoFunctions.js');
const Person = require('./db/models/Person.js');

const port = process.env.PORT || 3001;
const dbUrl = process.env.MONGODB_URL;

if (!dbUrl) {
    console.log('Missing database url in environment variables. Please set variable \'MONGODB_URL\' and restart application');
    process.exit(1);
}

morgan.token('body', (req) => JSON.stringify(req.body));

app.use(cors());
app.use(express.json());
app.use(express.static('build'));
app.use(morgan(':method :url :status :res[content-length] - :response-time ms :body'));

db.connect(dbUrl);

const basePath = '/api/';

const throwErrorAndHandleIt = (name, message, next) => {
    let err = new Error();

    if (!name) {
        console.error('Error name was null/undefined');
    } else {
        err.name = name;
    }

    if (!message) {
        console.error('Error message was null/undefined');
        err.message = 'Unknown message';
    } else {
        err.message = message;
    }

    try {
        throw err;
    } catch (error) {
        next(error);
    }

};

// const validatePerson = (person, next) => {
//     if (!person.name || person.name.length === 0) {
//         throwErrorAndHandleIt('IllegalArgumentError', 'Name must not be null or empty', next);
//     }

//     if (!person.number || person.number.length === 0) {
//         throwErrorAndHandleIt('IllegalArgumentError', 'Number must not be null or empty', next);
//     }
// }


app.get(basePath + 'persons', (req, res, next) => {
    Person
        .find({})
        .then(data => res.json(data))
        .catch(err => {
            console.error(err);
            throwErrorAndHandleIt('SourceError', 'Failed to get persons', next);
        });
});

app.get(basePath + 'persons/:id', (req, res, next) => {
    Person
        .findById(req.params.id)
        .then(person => {
            if (person) {
                res.json(person);
            } else {
                throwErrorAndHandleIt('NotFoundError', 'Not found', next);
            }
        })
        .catch(err => {
            console.error(err);
            next(err);
        });
});

app.post(basePath + 'persons', (req, res, next) => {
    let newPerson = { ...req.body };
    // validatePerson(newPerson, next);

    Person
        .find({ name: newPerson.name.toString() })
        .then((value) =>  {
            if (value.length > 0) {
                throwErrorAndHandleIt('IllegalArgumentError', 'Name must be unique', next);
            } else {
                const person = new Person({ ...newPerson });
                return person.save();
            }
        })
        .then(savedPerson => res.json(savedPerson))
        .catch(err => {
            console.error(err);
            if (err.name !== 'ValidationError') {
                throwErrorAndHandleIt('SourceError', 'Failed to store person', next);
            }
            next(err);
        });
});

app.put(basePath + 'persons/:id', (req, res, next) => {
    let updatedPerson = { ...req.body };
    // validatePerson(updatedPerson, next);

    Person
        .findByIdAndUpdate(req.params.id, updatedPerson, { new: true })
        .then(value => res.json(value))
        .catch(err => {
            console.error(err);
            if (err.name !== 'ValidationError') {
                throwErrorAndHandleIt('SourceError', `Failed to update person with id: ${req.params.id}`, next);
            }
            next(err);
        });
});

app.delete(basePath + 'persons/:id', (req, res, next) => {
    const id = req.params.id;
    if (id) {
        Person
            .deleteOne({ _id: req.params.id })
            .then(() => {
                res.sendStatus(204);
            })
            .catch(err => {
                console.error(err);
                throwErrorAndHandleIt('NotFoundError', 'Not found', next);
            });
    } else {
        throwErrorAndHandleIt('IllegalArgumentError', 'id must not be null: /api/persons/<id>', next);
    }

});

app.get('/info', (req, res, next) => {
    Person
        .count({})
        .then(count => {
            const resBody = `<div><p>Phonebook has info for ${count} people</p><p>${new Date()}</p></div>`;
            res.send(resBody);
        })
        .catch(err => {
            console.error(err);
            throwErrorAndHandleIt('SourceError', 'Failed to get phonebook info', next);
        });

});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

app.use((error, request, response, next) => {
    if (error.name === 'CastError') {
        return response.status(400).json({ error: 'Malformed id' });
    }

    if (error.name === 'ValidationError') {
        return response.status(400).json({ error: error.message });
    }

    if (error.name === 'IllegalArgumentError') {
        return response.status(400).json({ error: error.message });
    }

    if (error.name === 'NotFoundError') {
        return response.status(404).json({ error: error.message });
    }

    if (error.name === 'SourceError') {
        return response.status(500).json({ error: error.message });
    }

    return next(error);
});