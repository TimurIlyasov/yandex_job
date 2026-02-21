export async function handler(event) {
  if (!process.env.GSHEET_ID || !process.env.APPS_SCRIPT_URL) {
    return {
      statusCode: 500,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ok: false, error: 'Missing env vars' })
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ok: false, error: 'Method Not Allowed' })
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');

    const payload = {
      sheetId: process.env.GSHEET_ID,
      name: String(body.name || '').trim(),
      phone: String(body.phone || '').trim(),
      telegram: String(body.telegram || '').trim(),
      city: String(body.city || '').trim(),
      transport: String(body.transport || '').trim(),
      citySlug: String(body.citySlug || '').trim(),
      page: String(body.page || '').trim(),
      referrer: String(body.referrer || '').trim(),
      userAgent: event.headers['user-agent'] || '',
      consent: !!body.consent
    };

    if (!payload.phone || !payload.telegram || !payload.city || !payload.consent) {
      return {
        statusCode: 400,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ok: false, error: 'Validation failed' })
      };
    }

    const r = await fetch(process.env.APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const text = await r.text();
    let json;
    try { json = JSON.parse(text); } catch { json = { ok: false, raw: text }; }

    // Главное изменение: возвращаем то, что вернул Apps Script
    return {
      statusCode: json.ok ? 200 : 502,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(json.ok ? json : { ok: false, error: 'AppsScript error', details: json })
    };
  } catch (e) {
    return {
      statusCode: 500,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ok: false, error: String(e) })
    };
  }
}
