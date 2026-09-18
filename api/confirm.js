module.exports = async function (req, res) {
    // 1. Ensure the request method from Safaricom is POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // 2. Securely pull credentials from Vercel Environment Variables
        const CONSUMER_KEY = process.env.CONSUMER_KEY;
        const CONSUMER_SECRET = process.env.CONSUMER_SECRET;
        const MACRODROID_WEBHOOK_KEY = process.env.MACRODROID_KEY;

        // 3. Extract transaction details sent by Safaricom's C2B webhook
        const payment = req.body;
        const transAmount = Number(payment.TransAmount); // Amount paid (e.g. 55)
        const customerPhone = payment.MSISDN;           // Buyer's phone number
        const receiptNo = payment.TransID;              // M-Pesa transaction code

        console.log(`Payment Verified: Ksh ${transAmount} from ${customerPhone} [Ref: ${receiptNo}]`);

        // 4. Map payment amounts to your specific data bundle packages
        const bundleMapping = {
            '55': '1GB_DAILY',
            '110': '2GB_DAILY',
            '23': '1GB_1HR',
            '30': '1000_SMS_DAILY'
        };

        const selectedBundle = bundleMapping[String(Math.round(transAmount))];

        if (selectedBundle) {
            console.log(`Matched Bundle: ${selectedBundle}. Initiating dispatch...`);

            // 5. Trigger your Android dispatch device via MacroDroid
            if (MACRODROID_WEBHOOK_KEY) {
                await fetch(`https://trigger.macrodroid.com/${MACRODROID_WEBHOOK_KEY}/fulfill_order?phone=${customerPhone}&bundle=${selectedBundle}`);
            }
        } else {
            console.log(`Warning: Unmapped payment amount received: Ksh ${transAmount}`);
        }

        // 6. Mandatory success response back to Safaricom
        return res.status(200).json({
            ResultCode: 0,
            ResultDesc: "Success"
        });

    } catch (error) {
        console.error('Webhook processing error:', error.message);
        return res.status(200).json({
            ResultCode: 0,
            ResultDesc: "Accepted"
        });
    }
};
