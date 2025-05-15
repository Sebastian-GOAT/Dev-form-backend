import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { JSONFile } from 'lowdb/node';
import { Low } from 'lowdb';

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 25,
  standardHeaders: true,
  legacyHeaders: false, 
  message: {
    status: 'fail',
    message: 'Too many requests, please try again in a minute.'
  }
});

const adapter = new JSONFile('db.json');
const db = new Low(adapter, []);

const app = express();
app.use(express.json());
app.use(helmet());
app.use(limiter);
app.use(cors({
    origin: [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://127.0.0.1:5500',
        'https://dev-form-eight.vercel.app'
    ]
}));

// Routes

// Post form
app.post('/postform', async (req, res) => {
    try {
        await db.read();
        db.data ||= [];

        const { selection } = req.body;

        if (!selection) {
            return res.status(400).json({
                status: 'fail',
                message: 'Please provide your selection.'
            });
        }

        const form = db.data.find(f => f.selection === selection);
        if (!form) {
            db.data.push({ selection, count: 1 });
        }
        else {
            form.count++;
        }

        await db.write();

        res.status(200).json({
            status: 'success',
            message: 'Successfully sent the form.'
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            status: 'fail',
            message: 'Failed to submit.'
        });
    }
});

// Get data
app.get('/getdata', async (_, res) => {
    try {
        await db.read();
        res.status(200).json({
            status: 'success',
            message: 'Successfully got the data.',
            data: db.data
        });
    }
    catch(err) {
        res.status(500).json({
            status: 'fail',
            message: 'Failed to get the data.'
        });
    }
});

// Listener
const port = 3000;
app.listen(port, () => console.log("Server is running on http://localhost:" + port));