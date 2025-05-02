import express from 'express';
import cors from 'cors';
import allRouters from "./routes/index.js"
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', join(__dirname, 'views'));

app.use(allRouters)

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
      message: 'Something went wrong!',
      error: process.env.NODE_ENV === 'production' ? {} : err
    });
  });

  app.get('/', (req, res) => {
    res.send('Server is working!');
  });
  
  app.get('/testing', (req, res) => {
    res.send('Server is working in testing mode!');
  });

  export default app