// fetch()-based Razorpay REST client, replacing the `razorpay` npm SDK
// (which wraps axios and isn't verified Workers-compatible). Razorpay's
// Orders API just needs Basic Auth with key_id:key_secret and a JSON body.
// Docs: https://razorpay.com/docs/api/orders/create/

async function createOrder(env, { amount, currency, receipt, notes }) {
  const keyId = env.RAZORPAY_KEY_ID || 'rzp_test_XXXXXXXXXXXX';
  const keySecret = env.RAZORPAY_KEY_SECRET || 'REPLACE_WITH_TEST_SECRET';
  const auth = btoa(`${keyId}:${keySecret}`);

  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ amount, currency, receipt, notes }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.description || 'Razorpay order creation failed');
  }
  return data;
}

export { createOrder };
