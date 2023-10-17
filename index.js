require('dotenv').config()
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const PORT = process.env.PORT || 5000;


const router = require('./routes/index')
const errorMiddleware = require('./middleware/error.middleware')
const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({
    credentials: true,
    origin: process.env.CLIENT_URL
}));
app.use('/api', router);
app.use(errorMiddleware);

app.listen(PORT, () => console.log(`Server started on PORT ${PORT}`));