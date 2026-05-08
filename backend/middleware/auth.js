import admin from '../config/firebase.js';
import { User } from '../models/index.js';

export async function requireUser(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing token' });
  }
  try {
    const decoded = await admin.auth().verifyIdToken(header.split('Bearer ')[1]);
    req.uid   = decoded.uid;
    req.email = decoded.email;
    let user  = await User.findOne({ uid: req.uid });
    if (!user) {
      user = await User.create({
        uid:   req.uid,
        email: req.email,
        name:  req.email.split('@')[0],
      });
    }
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}
