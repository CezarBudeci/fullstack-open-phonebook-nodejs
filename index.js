const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
morgan.token('body', (req, res) => JSON.stringify(req.body));
app.use(morgan(':method :url :status :res[content-length] - :response-time ms :body'));

const basePath = "/api/";

let persons = [
    { 
      "id": 1,
      "name": "Arto Hellas", 
      "number": "040-123456"
    },
    { 
      "id": 2,
      "name": "Ada Lovelace", 
      "number": "39-44-5323523"
    },
    { 
      "id": 3,
      "name": "Dan Abramov", 
      "number": "12-43-234345"
    },
    { 
      "id": 4,
      "name": "Mary Poppendieck", 
      "number": "39-23-6423122"
    }
];

const generateNewId = () => {
    let id = undefined;
    while (true) {
        id = Math.floor(Math.random() * (1000 - 1 + 1) + 1);
        const existingPerson = persons.find(person => person.id === id);
        if (!existingPerson) {
            break;
        }
    }
    return id;
}

const validatePerson = (person) => {
    if (!person.name || person.name.length === 0) {
        return { error: 'name must not be null or empty'};
    }

    if (!person.number || person.number.length === 0) {
        return { error: 'number must not be null or empty'};
    }

    const existingNames = persons.filter(item => item.name.toLowerCase() === person.name.toLowerCase());
    if (existingNames.length >= 1) {
        return { error: 'name must be unique'};
    }

}

const addNewPerson = (person) => {
    const error = validatePerson(person);
    if (error) {
        return error;
    }
    person.id = generateNewId();
    persons.push(person);
    return person;
}

app.get(basePath + "persons", (req, res) => {
    res.json(persons);
});

app.get(basePath + 'persons/:id', (req, res) => {
    const id = Number(req.params.id);
    const person = persons.find(item => item.id === id);
    if (person) {
        res.json(person);
    } else {
        res.sendStatus(404);
    }
})

app.post(basePath + 'persons', (req, res) => {
    let newPerson = {...req.body};
    newPerson = addNewPerson(newPerson);
    if (newPerson.error) {
        res.status(400).json(newPerson);
    } else {
        res.json(newPerson);
    }
})

app.delete(basePath + 'persons/:id', (req, res) => {
    const id = Number(req.params.id);
    persons = persons.filter(person => person.id !== id);
    res.sendStatus(204);
})

app.get("/info", (req, res) => {
    const resBody = `<div><p>Phonebook has info for ${persons.length} people</p><p>${new Date()}</p></div>`;
    res.send(resBody);
})

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});