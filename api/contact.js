const nodemailer = require('nodemailer');
const { parse } = require('querystring');

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).end();
    return;
  }

  const raw = await readBody(req);
  const { name, company, email, phone, enquiry_type, message } = parse(raw);

  if (!name || !email || !message) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: `"Vibmon Website" <${process.env.SMTP_USER}>`,
    to: process.env.CONTACT_EMAIL || 'vibmon@hotmail.com',
    replyTo: email,
    subject: `[Vibmon] ${enquiry_type || 'Website enquiry'} from ${name}`,
    text: [
      `Name: ${name}`,
      `Company: ${company || '—'}`,
      `Email: ${email}`,
      `Phone: ${phone || '—'}`,
      `Enquiry type: ${enquiry_type || '—'}`,
      '',
      message,
    ].join('\n'),
  });

  res.status(200).json({ ok: true });
};
