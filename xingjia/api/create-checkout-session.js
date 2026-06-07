const Stripe = require("stripe");
const { quote } = require("./quote");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return res.status(503).json({ error: "Stripe is not configured yet. Add STRIPE_SECRET_KEY in Vercel." });
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { return res.status(400).json({ error: "Invalid JSON" }); }
  }

  const { sel, email } = body || {};
  let q;
  try {
    q = quote(sel);
  } catch (err) {
    return res.status(400).json({ error: err.message || "Invalid desk configuration" });
  }

  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const proto = req.headers["x-forwarded-proto"] || "https";
  const origin = host ? `${proto}://${host}` : "https://furniture-factory-seven.vercel.app";

  const stripe = new Stripe(secret);

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      currency: "sgd",
      customer_email: email || undefined,
      line_items: q.lines.map((line) => ({
        quantity: 1,
        price_data: {
          currency: "sgd",
          unit_amount: Math.round(line.amount * 100),
          product_data: {
            name: line.name,
            description: q.description,
          },
        },
      })),
      success_url: `${origin}/customise?paid=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/customise?cancelled=1`,
      metadata: {
        motor: q.sel.motor,
        frameColour: q.sel.frameColour,
        material: q.sel.material,
        topColour: q.sel.topColour,
        length: q.sel.length,
        breadth: q.sel.breadth,
        edge: q.sel.edge,
        total_sgd: String(q.total),
      },
    });

    return res.status(200).json({ url: session.url, id: session.id });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return res.status(500).json({ error: err.message || "Could not start checkout" });
  }
};
