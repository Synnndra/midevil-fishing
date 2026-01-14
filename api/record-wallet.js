// Record wallet addresses
export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', 'https://midevil-fishing.vercel.app');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { wallet } = req.body;

    if (!wallet) {
        return res.status(400).json({ error: 'Wallet address required' });
    }

    // Log the wallet (visible in Vercel logs dashboard)
    console.log(`[WALLET RECORDED] ${new Date().toISOString()} - ${wallet}`);

    // You can extend this to store in a database
    // For now, it logs to Vercel's logging system

    return res.status(200).json({ success: true, recorded: wallet });
}
