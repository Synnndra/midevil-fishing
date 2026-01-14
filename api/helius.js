// Helius API Proxy for wallet NFT fetching
const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const RATE_LIMIT_PREFIX = 'rate_limit_helius:';
const RATE_LIMIT_WINDOW = 60; // 1 minute
const RATE_LIMIT_MAX = 10; // 10 requests per minute per IP

async function redisIncr(key) {
    const response = await fetch(`${UPSTASH_URL}/incr/${key}`, {
        headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` }
    });
    const data = await response.json();
    return data.result;
}

async function redisExpire(key, seconds) {
    await fetch(`${UPSTASH_URL}/expire/${key}/${seconds}`, {
        headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` }
    });
}

async function checkRateLimit(ip) {
    if (!UPSTASH_URL || !UPSTASH_TOKEN) return true; // Skip if Redis not configured
    const key = `${RATE_LIMIT_PREFIX}${ip}`;
    const count = await redisIncr(key);
    if (count === 1) {
        await redisExpire(key, RATE_LIMIT_WINDOW);
    }
    return count <= RATE_LIMIT_MAX;
}

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

    // Rate limiting
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.headers['x-real-ip'] || 'unknown';
    const withinLimit = await checkRateLimit(ip);
    if (!withinLimit) {
        return res.status(429).json({ error: 'Too many requests' });
    }

    const apiKey = process.env.HELIUS_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'API key not configured' });
    }

    const { wallet, collection, page = 1 } = req.body;

    if (!wallet) {
        return res.status(400).json({ error: 'Wallet address required' });
    }

    try {
        const url = `https://mainnet.helius-rpc.com/?api-key=${apiKey}`;

        // Fetch NFTs owned by wallet
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 'wallet-nfts',
                method: 'searchAssets',
                params: {
                    ownerAddress: wallet,
                    grouping: ['collection', collection],
                    page: page,
                    limit: 1000
                }
            })
        });

        if (!response.ok) {
            throw new Error('Helius API request failed');
        }

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message || 'API error');
        }

        return res.status(200).json({
            items: data.result?.items || []
        });

    } catch (error) {
        console.error('Helius API error:', error);
        return res.status(500).json({ error: error.message });
    }
}
