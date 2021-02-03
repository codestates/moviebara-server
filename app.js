const express = require('express');
const logger = require('morgan');
const cors = require('cors');
const bodyparser = require('body-parser');
const cookieParser = require("cookie-parser");
const port = process.env.PORT || 4000;

const app = express();

app.use(logger('dev'));

app.use(cors({
    origin: true,
    methods: 'GET, POST, PATCH, DELETE, OPTIONS',
    credentials: true
}))

app.use(cookieParser());
app.use(bodyparser.json());

app.listen(port, () => console.log("hello"))