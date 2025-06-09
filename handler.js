const axios = require('axios');

const menu = [
  { category: "Appetizer", name: "Bruschetta", price: 8, allergens: ["gluten"] },
  { category: "Appetizer", name: "Stuffed Mushrooms", price: 9, allergens: ["dairy"] },
  { category: "Main",     name: "Garlic Butter Shrimp", price: 18, allergens: ["shellfish"] },
  { category: "Dessert",  name: "No-Bake Oreo Cheesecake", price: 7, allergens: ["dairy","gluten"] }
];

exports.handler = async (event) => {
  let message = "";
  try {
    const body = JSON.parse(event.body || '{}');
    message = body.message || '';
  } catch (err) {
    return {
      statusCode: 400,
      body: JSON.stringify({ reply: 'Invalid request body' })
    };
  }

  const text = message.toLowerCase();
  let intent = 'none';
  if (/\b(reserve|book|table)\b/.test(text)) {
    intent = 'reservation';
  } else if (/\b(menu|appetizer|vegan|under|price)\b/.test(text)) {
    intent = 'menu_query';
  } else if (/\b(special|today'?s|deal)\b/.test(text)) {
    intent = 'specials';
  }

  let reply = '';

  if (intent === 'reservation') {
    const dateMatch = text.match(/on ([a-zA-Z0-9\s]+?) at/);
    const timeMatch = text.match(/at ([0-9]{1,2}(:[0-9]{2})?\s?(am|pm))/);
    const sizeMatch = text.match(/for (\d+)/);
    const date = dateMatch ? dateMatch[1] : '';
    const time = timeMatch ? timeMatch[1] : '';
    const partySize = sizeMatch ? parseInt(sizeMatch[1], 10) : null;
    try {
      await axios.post(
        'https://api.opentable.com/v1/reservations',
        { date, time, party_size: partySize },
        { headers: { Authorization: `Bearer ${process.env.OPENTABLE_API_KEY}` } }
      );
      reply = `Your table for ${partySize} on ${date} at ${time} is booked!`;
    } catch (err) {
      console.error(err);
      reply = 'Sorry, we could not complete your reservation at this time.';
    }
  } else if (intent === 'menu_query') {
    const priceMatch = text.match(/under\s*\$?(\d+)/);
    const maxPrice = priceMatch ? Number(priceMatch[1]) : Infinity;
    const categoryMatch = text.match(/\b(appetizer|main|dessert)\b/);
    const category = categoryMatch ?
      categoryMatch[1].charAt(0).toUpperCase() + categoryMatch[1].slice(1) : null;
    const allergens = /vegan/.test(text) ? ['dairy', 'gluten', 'shellfish'] : [];

    const filtered = menu.filter(item =>
      (category ? item.category === category : true) &&
      item.price <= maxPrice &&
      !allergens.some(a => item.allergens.includes(a))
    );
    if (filtered.length) {
      reply = 'We have ' + filtered.map(i => `${i.name} ($${i.price})`).join(', ') + '.';
    } else {
      reply = 'No matching menu items found.';
    }
  } else if (intent === 'specials') {
    reply = "Today’s specials: ...";
  } else {
    reply = 'I can help you book a table or answer menu questions. How can I assist?';
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ reply })
  };
};
