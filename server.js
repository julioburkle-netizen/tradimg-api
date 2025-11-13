const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;
const TWELVE_API_KEY = 'd6a9a20064194b83b1f4ad3f84cd9e63';

// Mapeo de símbolos
const symbolMap = {
  'NDX': 'NDX',
  'SPX': 'SPX', 
  'DJI': 'DJI',
  'DAX': 'DAX',
  'FTSE': 'FTSE',
  'EURUSD': 'EUR/USD',
  'GBPUSD': 'GBP/USD',
  'BTCUSD': 'BTC/USD',
  'ETHUSD': 'ETH/USD'
};

// Endpoint principal para obtener datos
app.get('/api/market/:symbol', async (req, res) => {
  try {
    const symbol = req.params.symbol;
    const twelveSymbol = symbolMap[symbol];
    
    if (!twelveSymbol) {
      return res.status(400).json({ error: 'Símbolo no válido' });
    }

    console.log(`Obteniendo datos para: ${twelveSymbol}`);

    // Usar Twelve Data API
    const url = `https://api.twelvedata.com/time_series?symbol=${twelveSymbol}&interval=5min&outputsize=100&apikey=${TWELVE_API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === 'error') {
      console.error('Error de Twelve Data:', data.message);
      return res.status(400).json({ 
        error: data.message,
        code: data.code 
      });
    }
    
    if (data.values && Array.isArray(data.values)) {
      const formatted = data.values.map(item => ({
        timestamp: new Date(item.datetime).getTime(),
        open: parseFloat(item.open),
        high: parseFloat(item.high),
        low: parseFloat(item.low),
        close: parseFloat(item.close),
        volume: parseInt(item.volume || 0)
      }));
      
      return res.json({ 
        success: true, 
        data: formatted.reverse(),
        source: 'twelvedata',
        symbol: twelveSymbol
      });
    }
    
    throw new Error('No se recibieron datos válidos');
    
  } catch (error) {
    console.error('Error en servidor:', error);
    res.status(500).json({ 
      error: 'Error al obtener datos', 
      message: error.message 
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'Trading Data API'
  });
});

// Root
app.get('/', (req, res) => {
  res.json({
    service: 'Trading Data API',
    status: 'running',
    endpoints: {
      market: '/api/market/:symbol',
      health: '/health'
    },
    symbols: Object.keys(symbolMap)
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📊 API Key configurada: ${TWELVE_API_KEY.substring(0, 8)}...`);
});
