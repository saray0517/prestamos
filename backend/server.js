const express = require('express');
const cors = require('cors');
require('dotenv').config();

const loansRoutes = require('./modules/loans/loans.routes');
const payRoutes = require('./modules/pay/pay.routes');

const app = express();
const port = process.env.PORT || 3008;

app.use(cors());
app.use(express.json());

app.use('/api/loans', loansRoutes);
app.use('/api/pay', payRoutes);

app.listen(port, () => {
  console.log(`Servidor corriendo en el puerto ${port}`);
});