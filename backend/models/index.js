import mongoose from 'mongoose';
const { Schema, model } = mongoose;

// ── USER ─────────────────────────────────────────────────────────────────────
const userSchema = new Schema({
  uid:      { type: String, required: true, unique: true },
  email:    { type: String, required: true, unique: true },
  name:     { type: String, default: '' },
  photoURL: { type: String, default: '' },
  plan:     { type: String, enum: ['free', 'pro'], default: 'free' },
  usage: {
    messages:  { type: Number, default: 0 },
    images:    { type: Number, default: 0 },
    scripts:   { type: Number, default: 0 },
    pipelines: { type: Number, default: 0 },
  },
}, { timestamps: true });

export const User = model('User', userSchema);

// ── CHAT ─────────────────────────────────────────────────────────────────────
const attachmentSchema = new Schema({
  type: { type: String, enum: ['image', 'model', 'render', 'video'], required: true },
  url:  { type: String, required: true },
}, { _id: false });

const messageSchema = new Schema({
  role:        { type: String, enum: ['user', 'assistant'], required: true },
  content:     { type: String, required: true },
  attachments: { type: [attachmentSchema], default: [] },
  createdAt:   { type: Date, default: Date.now },
});

const chatSchema = new Schema({
  userId:      { type: String, required: true, index: true },
  type:        { type: String, enum: ['primary', 'secondary'], default: 'primary' },
  title:       { type: String, default: 'New conversation' },
  messages:    [messageSchema],
  linkedChatId:{ type: Schema.Types.ObjectId, ref: 'Chat', default: null },
}, { timestamps: true });

export const Chat = model('Chat', chatSchema);

// ── IMAGE ─────────────────────────────────────────────────────────────────────
const imageSchema = new Schema({
  userId: { type: String, required: true, index: true },
  prompt: { type: String, required: true },
  url:    { type: String, required: true },
  status: { type: String, enum: ['pending', 'done', 'failed'], default: 'done' },
}, { timestamps: true });

export const Image = model('Image', imageSchema);

// ── SCRIPT ────────────────────────────────────────────────────────────────────
const scriptSchema = new Schema({
  userId:      { type: String, required: true, index: true },
  title:       { type: String, required: true },
  prompt:      { type: String, required: true },
  code:        { type: String, required: true },
  filePath:    { type: String, default: null },
  renderPath:  { type: String, default: null },
  status:      { type: String, enum: ['generated', 'running', 'done', 'failed'], default: 'generated' },
  log:         { type: String, default: '' },
  executedAt:  { type: Date, default: null },
}, { timestamps: true });

export const Script = model('Script', scriptSchema);

// ── PIPELINE ──────────────────────────────────────────────────────────────────
const pipelineSchema = new Schema({
  userId:     { type: String, required: true, index: true },
  prompt:     { type: String, required: true },
  status:     { type: String, enum: ['queued','mesh','scripting','rendering','done','failed'], default: 'queued' },
  meshPath:   { type: String, default: null },
  scriptPath: { type: String, default: null },
  renderPath: { type: String, default: null },
  bpyCode:    { type: String, default: '' },
  log:        { type: String, default: '' },
  error:      { type: String, default: '' },
}, { timestamps: true });

export const Pipeline = model('Pipeline', pipelineSchema);
