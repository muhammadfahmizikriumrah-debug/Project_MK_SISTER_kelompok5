const cors = require('cors');

// ...existing code...

const app = express();
app.use(express.json());

// Konfigurasi CORS untuk development (ganti FRONTEND_ORIGIN jika perlu)
const corsOptions = {
  origin: process.env.FRONTEND_ORIGIN || 'http://localhost:3000',
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','Accept','X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200
};

// Pasang CORS sebelum route dan middleware lain yang mungkin memblok preflight
app.use(cors(corsOptions));
// Pastikan preflight (OPTIONS) dijawab 200 untuk semua path
app.options('*', cors(corsOptions), (req, res) => res.sendStatus(200));

// ...existing code...
// sisa middleware dan route registration...