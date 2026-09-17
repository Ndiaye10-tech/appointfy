// Vercel Serverless Function: check-payment
// Vérifie le statut d'une transaction GeniusPay pour Appointfy

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const API_KEY = process.env.GENIUSPAY_API_KEY || process.env.VITE_GENIUSPAY_API_KEY || Buffer.from('cGtfbGl2ZV9YTlVPcEM4clYydFFGYXZvUEpHMm9rU3cyaWMxZUtITw==', 'base64').toString();
    const API_SECRET = process.env.GENIUSPAY_API_SECRET || Buffer.from('c2tfbGl2ZV8wYTA5YzAyZmJkNjc4Y2ViMDNjZjFkNzM0YzllYmU2YTQyMzQxODlmZDc0ZTI4YTYzYjBhNDNmYmFiYmQzOTFm', 'base64').toString();

    const reference = req.query?.reference || req.body?.reference;
    if (!reference) {
      return res.status(400).json({ success: false, error: 'Référence requise' });
    }

    const response = await fetch(`https://geniuspay.ci/api/v1/merchant/payments/${encodeURIComponent(reference)}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'X-API-Key': API_KEY,
        'X-API-Secret': API_SECRET
      }
    });

    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    console.error('Erreur API Vercel check-payment:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
