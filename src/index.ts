import express from 'express';
import session from 'express-session';
import bodyParser from 'body-parser';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import mysql from 'mysql';

const prisma = new PrismaClient();
const saltRounds = 10;

const connessione = mysql.createConnection({
  host: '127.0.0.1',
  user: 'unilink_prisma',
  password: 'unilink',
  database: 'magazzino'
});

connessione.connect((err) => {
  if (err) {
    console.error('Errore nella connessione al database:', err);
  } else {
    console.log('Connesso al database MySQL');
  }
});

declare module 'express-session' {
  interface Session {
    user?: {
      id: number;
      email: string;
      name: string;
    };
  }
}

const app = express();
const PORT = 3000;

app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
}));

app.use(bodyParser.json());


app.post('/api/login', (req, res) => {
  const { name, password } = req.body;


  connessione.query('SELECT * FROM user WHERE name = ?', [name], (error, results) => {
    if (error) {
      console.error('Errore nella query SQL:', error);
      return res.status(500).json({ message: 'Errore interno del server' });
    }

    if (results.length === 0) {
      return res.status(401).json({ message: 'Credenziali non valide' });
    }

    const userFromDB = results[0];

    bcrypt.compare(password, userFromDB.password, (err, passwordMatch) => {
      if (err) {
        console.error('Errore durante il confronto delle password:', err);
        return res.status(500).json({ message: 'Errore interno del server' });
      }


      if (passwordMatch) {
        req.session.user = userFromDB;
        return res.status(200).json({
          message: 'Login riuscito',
          user: {
            name: userFromDB.name,

          }
        });
      } else {
        return res.status(401).json({ message: 'Credenziali non valide' });
      }

    });
  });
});
app.get('/api/user', (req, res) => {
  if (req.session.user) {

    res.status(200).json(req.session.user);
  } else {
    res.status(401).json({ message: 'Utente non autenticato' });
  }
});


app.post('/api/signup', (req, res) => {
  const { name, email, password } = req.body;


  bcrypt.hash(password, saltRounds, (err, hashedPassword) => {
    if (err) {
      console.error('Errore durante l\'hashing della password:', err);
      return res.status(500).json({ message: 'Errore interno del server' });
    }

    connessione.query('INSERT INTO user (name, email, password) VALUES (?, ?, ?)', [name, email, hashedPassword], (error) => {
      if (error) {
        console.error('Errore durante l\'inserimento dell\'utente:', error);
        return res.status(500).json({ message: 'Errore interno del server' });
      }

      return res.status(201).json({ message: 'Utente registrato con successo' });
    });
  });
});


app.get('/api/products', async (req, res) => {
  try {
    const products = await prisma.product.findMany();
    res.json(products);
  } catch (error) {
    console.error('Errore durante il recupero dei prodotti dal database:', error);
    res.status(500).json({ message: 'Errore interno del server' });
  }
});
app.post('/api/products/:productId', (req, res) => {
  const productId = parseInt(req.params.productId);
  const newQuantity = req.body.quantity;


  prisma.product.update({
    where: { id: productId },
    data: { quantity: newQuantity },
  })
    .then((updatedProduct) => {
      res.status(200).json({ message: 'Quantità aggiornata con successo' });
    })
    .catch((error) => {
      console.error('Errore durante l\'aggiornamento della quantità:', error);
      res.status(500).json({ message: 'Errore durante l\'aggiornamento della quantità' });
    });
});

app.use(express.static(__dirname + '/public'));

app.listen(PORT, () => {
  console.log(`Server in ascolto sulla porta ${PORT}`);
});
